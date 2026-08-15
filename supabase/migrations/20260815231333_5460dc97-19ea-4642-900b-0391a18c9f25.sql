-- ===================== multi-team rival teams =====================
ALTER TABLE public.rival_teams ADD COLUMN IF NOT EXISTS team_index integer NOT NULL DEFAULT 0;
ALTER TABLE public.rival_teams ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.rival_teams ADD COLUMN IF NOT EXISTS stamina_used integer NOT NULL DEFAULT 0;
ALTER TABLE public.rival_teams ADD COLUMN IF NOT EXISTS stamina_day date;
ALTER TABLE public.rival_teams DROP CONSTRAINT IF EXISTS rival_teams_pkey;
ALTER TABLE public.rival_teams ADD PRIMARY KEY (user_id, team_index);
ALTER TABLE public.rival_teams ADD CONSTRAINT rival_teams_index_range CHECK (team_index BETWEEN 0 AND 3);

ALTER TABLE public.rival_stats ADD COLUMN IF NOT EXISTS defenses_today integer NOT NULL DEFAULT 0;
ALTER TABLE public.rival_stats ADD COLUMN IF NOT EXISTS defenses_day date;
ALTER TABLE public.rival_stats ADD COLUMN IF NOT EXISTS battles integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.rival_weekly (
  user_id uuid NOT NULL,
  week_start date NOT NULL,
  points integer NOT NULL DEFAULT 0,
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, week_start)
);
GRANT SELECT ON public.rival_weekly TO authenticated;
GRANT ALL ON public.rival_weekly TO service_role;
ALTER TABLE public.rival_weekly ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rival weekly readable" ON public.rival_weekly FOR SELECT TO authenticated USING (true);

-- ===================== teams API =====================
CREATE OR REPLACE FUNCTION public.get_my_rival_teams()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid(); v_today date := public.current_day_key()::date; v_out jsonb;
BEGIN
  IF v_user IS NULL THEN RETURN '[]'::jsonb; END IF;
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'team_index', t.team_index, 'slots', t.slots, 'name', t.name,
    'stamina_left', GREATEST(0, 3 - CASE WHEN t.stamina_day = v_today THEN t.stamina_used ELSE 0 END)
  ) ORDER BY t.team_index), '[]'::jsonb)
  INTO v_out FROM public.rival_teams t WHERE t.user_id = v_user;
  RETURN v_out;
END; $$;

CREATE OR REPLACE FUNCTION public.set_rival_team(p_slots jsonb, p_index integer DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid(); v_ids text[]; v_id text; v_count int;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  IF p_index IS NULL OR p_index < 0 OR p_index > 3 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_team'); END IF;
  IF jsonb_typeof(p_slots) <> 'array' OR jsonb_array_length(p_slots) <> 5 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'need_five'); END IF;
  SELECT array_agg(value::text) INTO v_ids FROM jsonb_array_elements_text(p_slots) value;
  IF (SELECT COUNT(DISTINCT x) FROM unnest(v_ids) x) <> 5 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'duplicates'); END IF;
  FOREACH v_id IN ARRAY v_ids LOOP
    SELECT 1 INTO v_count FROM public.user_collection WHERE user_id = v_user AND character_id = v_id LIMIT 1;
    IF v_count IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'not_owned', 'character_id', v_id); END IF;
    v_count := NULL;
  END LOOP;
  INSERT INTO public.rival_teams (user_id, team_index, slots, updated_at)
  VALUES (v_user, p_index, p_slots, now())
  ON CONFLICT (user_id, team_index) DO UPDATE SET slots = EXCLUDED.slots, updated_at = now();
  RETURN jsonb_build_object('ok', true);
END; $$;

CREATE OR REPLACE FUNCTION public.delete_rival_team(p_index integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  IF p_index = 0 THEN RETURN jsonb_build_object('ok', false, 'error', 'cannot_delete_primary'); END IF;
  DELETE FROM public.rival_teams WHERE user_id = auth.uid() AND team_index = p_index;
  RETURN jsonb_build_object('ok', true);
END; $$;

-- ===================== stats =====================
CREATE OR REPLACE FUNCTION public.get_my_rival_stats()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid(); v_row public.rival_stats%ROWTYPE;
  v_today date := public.current_day_key()::date; v_bt int; v_def int; v_week date;
  v_wk public.rival_weekly%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  v_week := public.duel_week_start();
  SELECT * INTO v_row FROM public.rival_stats WHERE user_id = v_user;
  SELECT * INTO v_wk FROM public.rival_weekly WHERE user_id = v_user AND week_start = v_week;
  v_bt := CASE WHEN v_row.user_id IS NULL OR v_row.battles_day <> v_today THEN 0 ELSE v_row.battles_today END;
  v_def := CASE WHEN v_row.user_id IS NULL OR v_row.defenses_day <> v_today THEN 0 ELSE v_row.defenses_today END;
  RETURN jsonb_build_object('ok', true,
    'rating', COALESCE(v_row.rating, 1000),
    'wins', COALESCE(v_row.wins, 0), 'losses', COALESCE(v_row.losses, 0),
    'battles_today', v_bt, 'battles_left', GREATEST(0, 12 - v_bt),
    'defenses_today', v_def, 'defenses_left', GREATEST(0, 12 - v_def),
    'weekly_points', COALESCE(v_wk.points, 0),
    'weekly_wins', COALESCE(v_wk.wins, 0), 'weekly_losses', COALESCE(v_wk.losses, 0),
    'week_start', v_week);
END; $$;

-- ===================== matchmaking =====================
CREATE OR REPLACE FUNCTION public.find_rival_opponent(p_team_index integer DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid(); v_today date := public.current_day_key()::date;
  v_rating int; v_band int; v_opp uuid; v_slots jsonb; v_username text; v_opp_rating int; v_ovr int;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  SELECT COALESCE(rating, 1000) INTO v_rating FROM public.rival_stats WHERE user_id = v_user;
  v_rating := COALESCE(v_rating, 1000);

  FOREACH v_band IN ARRAY ARRAY[100, 250, 500, 100000] LOOP
    SELECT rt.user_id, rt.slots, COALESCE(rs.rating, 1000)
      INTO v_opp, v_slots, v_opp_rating
    FROM public.rival_teams rt
    JOIN public.profiles p ON p.user_id = rt.user_id
    LEFT JOIN public.rival_stats rs ON rs.user_id = rt.user_id
    WHERE rt.user_id <> v_user
      AND rt.team_index = 0
      AND jsonb_array_length(rt.slots) = 5
      AND p.username IS NOT NULL
      AND abs(COALESCE(rs.rating, 1000) - v_rating) <= v_band
      AND COALESCE(CASE WHEN rs.defenses_day = v_today THEN rs.defenses_today ELSE 0 END, 0) < 12
      AND NOT EXISTS (
        SELECT 1 FROM public.rival_daily_matches m
        WHERE m.attacker_id = v_user AND m.defender_id = rt.user_id AND m.day = v_today)
    ORDER BY random() LIMIT 1;
    EXIT WHEN v_opp IS NOT NULL;
  END LOOP;

  IF v_opp IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'no_opponent'); END IF;
  SELECT username INTO v_username FROM public.profiles WHERE user_id = v_opp;
  SELECT COALESCE(SUM(cc.overall), 0) INTO v_ovr
    FROM jsonb_array_elements_text(v_slots) s JOIN public.characters_catalog cc ON cc.id = s.value;
  RETURN jsonb_build_object('ok', true, 'opponent_id', v_opp, 'username', v_username,
    'team', v_slots, 'rating', v_opp_rating, 'team_power', ROUND(v_ovr::numeric / 5, 1));
END; $$;

-- ===================== battle =====================
CREATE OR REPLACE FUNCTION public.battle_rival(p_opponent uuid, p_team_index integer DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_today date := public.current_day_key()::date;
  v_week date := public.duel_week_start();
  v_att_slots jsonb; v_def_slots jsonb;
  v_att_ovr numeric := 0; v_def_ovr numeric := 0;
  v_att_score numeric(6,2); v_def_score numeric(6,2);
  v_winner uuid;
  v_att_rating int; v_def_rating int;
  v_elo numeric; v_power numeric; v_expected numeric; v_actual numeric;
  v_k int; v_delta int; v_att_delta int; v_def_delta int;
  v_att_stats public.rival_stats%ROWTYPE; v_def_stats public.rival_stats%ROWTYPE;
  v_bt int; v_def_count int; v_stamina int; v_battle_id uuid; v_souls int;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  IF p_opponent IS NULL OR p_opponent = v_user THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_opponent'); END IF;
  IF COALESCE(p_team_index, 0) < 0 OR COALESCE(p_team_index, 0) > 3 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_team'); END IF;

  IF EXISTS (SELECT 1 FROM public.rival_daily_matches
             WHERE attacker_id = v_user AND defender_id = p_opponent AND day = v_today) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_fought_today');
  END IF;

  SELECT * INTO v_att_stats FROM public.rival_stats WHERE user_id = v_user;
  SELECT * INTO v_def_stats FROM public.rival_stats WHERE user_id = p_opponent;
  v_bt := CASE WHEN v_att_stats.user_id IS NULL OR v_att_stats.battles_day <> v_today
               THEN 0 ELSE v_att_stats.battles_today END;
  IF v_bt >= 12 THEN RETURN jsonb_build_object('ok', false, 'error', 'daily_limit'); END IF;

  v_def_count := CASE WHEN v_def_stats.user_id IS NULL OR v_def_stats.defenses_day <> v_today
                      THEN 0 ELSE v_def_stats.defenses_today END;
  IF v_def_count >= 12 THEN RETURN jsonb_build_object('ok', false, 'error', 'defender_shielded'); END IF;

  -- team + stamina (per team, not per card)
  SELECT slots, GREATEST(0, 3 - CASE WHEN stamina_day = v_today THEN stamina_used ELSE 0 END)
    INTO v_att_slots, v_stamina
    FROM public.rival_teams WHERE user_id = v_user AND team_index = COALESCE(p_team_index, 0);
  IF v_att_slots IS NULL OR jsonb_array_length(v_att_slots) <> 5 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'need_team'); END IF;
  IF COALESCE(v_stamina, 0) <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_stamina'); END IF;

  SELECT slots INTO v_def_slots FROM public.rival_teams WHERE user_id = p_opponent AND team_index = 0;
  IF v_def_slots IS NULL OR jsonb_array_length(v_def_slots) <> 5 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'opponent_no_team'); END IF;

  SELECT COALESCE(SUM(cc.overall), 0)::numeric / 5 INTO v_att_ovr
    FROM jsonb_array_elements_text(v_att_slots) s JOIN public.characters_catalog cc ON cc.id = s.value;
  SELECT COALESCE(SUM(cc.overall), 0)::numeric / 5 INTO v_def_ovr
    FROM jsonb_array_elements_text(v_def_slots) s JOIN public.characters_catalog cc ON cc.id = s.value;

  -- Battle roll: team power plus bounded variance, small defender edge.
  v_att_score := ROUND(GREATEST(0, LEAST(120, v_att_ovr + (random() * 12 - 6)))::numeric, 2);
  v_def_score := ROUND(GREATEST(0, LEAST(120, v_def_ovr + 1.5 + (random() * 12 - 6)))::numeric, 2);
  IF v_att_score > v_def_score THEN v_winner := v_user;
  ELSIF v_def_score > v_att_score THEN v_winner := p_opponent;
  ELSE v_winner := NULL; END IF;

  v_att_rating := COALESCE(v_att_stats.rating, 1000);
  v_def_rating := COALESCE(v_def_stats.rating, 1000);

  -- Fair expectation: blend rating gap with roster-power gap.
  v_elo := 1.0 / (1.0 + power(10.0, (v_def_rating - v_att_rating)::numeric / 400.0));
  v_power := 1.0 / (1.0 + power(10.0, (v_def_ovr - v_att_ovr) / 8.0));
  v_expected := 0.5 * v_elo + 0.5 * v_power;
  v_actual := CASE WHEN v_winner = v_user THEN 1.0 WHEN v_winner = p_opponent THEN 0.0 ELSE 0.5 END;

  -- Placement K for the first 10 battles, then a calm K.
  v_k := CASE WHEN COALESCE(v_att_stats.battles, 0) < 10 THEN 40 ELSE 24 END;
  v_delta := ROUND(v_k * (v_actual - v_expected));
  IF v_winner = v_user THEN
    v_delta := GREATEST(4, LEAST(35, v_delta));
  ELSIF v_winner = p_opponent THEN
    -- softer losses against clearly stronger rivals, never a free fall
    v_delta := LEAST(-2, GREATEST(CASE WHEN v_def_rating - v_att_rating >= 150 THEN -8 ELSE -22 END, v_delta));
  ELSE
    v_delta := GREATEST(-6, LEAST(6, v_delta));
  END IF;
  v_att_delta := v_delta;
  v_def_delta := -ROUND(v_delta * 0.6);  -- defenders are passive: reduced swing

  INSERT INTO public.rival_stats (user_id, rating, wins, losses, battles, battles_today, battles_day, updated_at)
  VALUES (v_user, GREATEST(0, v_att_rating + v_att_delta),
    CASE WHEN v_winner = v_user THEN 1 ELSE 0 END,
    CASE WHEN v_winner = p_opponent THEN 1 ELSE 0 END,
    1, v_bt + 1, v_today, now())
  ON CONFLICT (user_id) DO UPDATE SET
    rating = GREATEST(0, public.rival_stats.rating + v_att_delta),
    wins = public.rival_stats.wins + CASE WHEN v_winner = v_user THEN 1 ELSE 0 END,
    losses = public.rival_stats.losses + CASE WHEN v_winner = p_opponent THEN 1 ELSE 0 END,
    battles = public.rival_stats.battles + 1,
    battles_today = CASE WHEN public.rival_stats.battles_day = v_today THEN public.rival_stats.battles_today + 1 ELSE 1 END,
    battles_day = v_today, updated_at = now();

  INSERT INTO public.rival_stats (user_id, rating, wins, losses, battles, defenses_today, defenses_day, updated_at)
  VALUES (p_opponent, GREATEST(0, v_def_rating + v_def_delta),
    CASE WHEN v_winner = p_opponent THEN 1 ELSE 0 END,
    CASE WHEN v_winner = v_user THEN 1 ELSE 0 END,
    1, v_def_count + 1, v_today, now())
  ON CONFLICT (user_id) DO UPDATE SET
    rating = GREATEST(0, public.rival_stats.rating + v_def_delta),
    wins = public.rival_stats.wins + CASE WHEN v_winner = p_opponent THEN 1 ELSE 0 END,
    losses = public.rival_stats.losses + CASE WHEN v_winner = v_user THEN 1 ELSE 0 END,
    battles = public.rival_stats.battles + 1,
    defenses_today = CASE WHEN public.rival_stats.defenses_day = v_today THEN public.rival_stats.defenses_today + 1 ELSE 1 END,
    defenses_day = v_today, updated_at = now();

  -- weekly boards
  INSERT INTO public.rival_weekly (user_id, week_start, points, wins, losses)
  VALUES (v_user, v_week, GREATEST(0, v_att_delta),
    CASE WHEN v_winner = v_user THEN 1 ELSE 0 END,
    CASE WHEN v_winner = p_opponent THEN 1 ELSE 0 END)
  ON CONFLICT (user_id, week_start) DO UPDATE SET
    points = public.rival_weekly.points + GREATEST(0, v_att_delta),
    wins = public.rival_weekly.wins + CASE WHEN v_winner = v_user THEN 1 ELSE 0 END,
    losses = public.rival_weekly.losses + CASE WHEN v_winner = p_opponent THEN 1 ELSE 0 END,
    updated_at = now();
  INSERT INTO public.rival_weekly (user_id, week_start, points, wins, losses)
  VALUES (p_opponent, v_week, GREATEST(0, v_def_delta),
    CASE WHEN v_winner = p_opponent THEN 1 ELSE 0 END,
    CASE WHEN v_winner = v_user THEN 1 ELSE 0 END)
  ON CONFLICT (user_id, week_start) DO UPDATE SET
    points = public.rival_weekly.points + GREATEST(0, v_def_delta),
    wins = public.rival_weekly.wins + CASE WHEN v_winner = p_opponent THEN 1 ELSE 0 END,
    losses = public.rival_weekly.losses + CASE WHEN v_winner = v_user THEN 1 ELSE 0 END,
    updated_at = now();

  -- burn one stamina from the attacking team
  UPDATE public.rival_teams SET
    stamina_used = CASE WHEN stamina_day = v_today THEN stamina_used + 1 ELSE 1 END,
    stamina_day = v_today, updated_at = now()
  WHERE user_id = v_user AND team_index = COALESCE(p_team_index, 0);

  v_souls := CASE WHEN v_winner = v_user THEN 30 WHEN v_winner IS NULL THEN 10 ELSE 5 END;
  IF v_winner = v_user AND v_def_rating - v_att_rating >= 150 THEN v_souls := v_souls + 20; END IF;
  UPDATE public.profiles SET souls = COALESCE(souls, 0) + v_souls, updated_at = now() WHERE user_id = v_user;

  INSERT INTO public.rival_battles (attacker_id, defender_id, attacker_team, defender_team,
    attacker_score, defender_score, winner_id, attacker_delta, defender_delta)
  VALUES (v_user, p_opponent, v_att_slots, v_def_slots,
    v_att_score, v_def_score, v_winner, v_att_delta, v_def_delta)
  RETURNING id INTO v_battle_id;

  INSERT INTO public.rival_daily_matches (attacker_id, defender_id, day)
    VALUES (v_user, p_opponent, v_today) ON CONFLICT DO NOTHING;

  SELECT GREATEST(0, 3 - CASE WHEN stamina_day = v_today THEN stamina_used ELSE 0 END)
    INTO v_stamina FROM public.rival_teams
    WHERE user_id = v_user AND team_index = COALESCE(p_team_index, 0);

  RETURN jsonb_build_object('ok', true, 'battle_id', v_battle_id,
    'attacker_score', v_att_score, 'defender_score', v_def_score,
    'winner_id', v_winner, 'attacker_delta', v_att_delta, 'defender_delta', v_def_delta,
    'new_rating', GREATEST(0, v_att_rating + v_att_delta),
    'souls_awarded', v_souls, 'battles_left', GREATEST(0, 12 - (v_bt + 1)),
    'stamina_left', COALESCE(v_stamina, 0));
END; $$;

-- ===================== weekly leaderboard =====================
CREATE OR REPLACE FUNCTION public.get_rival_weekly_leaderboard(p_limit integer DEFAULT 100)
RETURNS TABLE(rank bigint, user_id uuid, username text, points integer, wins integer, losses integer,
              rating integer, title text, username_color text, name_frame text, avatar_character_id text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT RANK() OVER (ORDER BY w.points DESC, w.wins DESC) AS rank,
    w.user_id, p.username, w.points, w.wins, w.losses,
    COALESCE(rs.rating, 1000), p.title, p.username_color, p.name_frame, p.avatar_character_id
  FROM public.rival_weekly w
  JOIN public.profiles p ON p.user_id = w.user_id
  LEFT JOIN public.rival_stats rs ON rs.user_id = w.user_id
  WHERE w.week_start = public.duel_week_start() AND p.username IS NOT NULL
  ORDER BY w.points DESC, w.wins DESC
  LIMIT GREATEST(1, LEAST(500, p_limit));
$$;