CREATE TABLE public.rival_teams (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  slots jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rival_teams TO authenticated;
GRANT ALL ON public.rival_teams TO service_role;
ALTER TABLE public.rival_teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own rival team readable" ON public.rival_teams FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.rival_stats (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL DEFAULT 1000,
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  battles_today integer NOT NULL DEFAULT 0,
  battles_day date NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rival_stats TO authenticated;
GRANT ALL ON public.rival_stats TO service_role;
ALTER TABLE public.rival_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rival stats readable by authenticated" ON public.rival_stats FOR SELECT TO authenticated USING (true);

CREATE TABLE public.rival_battles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attacker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  defender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attacker_team jsonb NOT NULL DEFAULT '[]'::jsonb,
  defender_team jsonb NOT NULL DEFAULT '[]'::jsonb,
  attacker_score numeric(6,2) NOT NULL,
  defender_score numeric(6,2) NOT NULL,
  winner_id uuid,
  attacker_delta integer NOT NULL DEFAULT 0,
  defender_delta integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rival_battles_attacker_idx ON public.rival_battles (attacker_id, created_at DESC);
CREATE INDEX rival_battles_defender_idx ON public.rival_battles (defender_id, created_at DESC);
GRANT SELECT ON public.rival_battles TO authenticated;
GRANT ALL ON public.rival_battles TO service_role;
ALTER TABLE public.rival_battles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own battles readable" ON public.rival_battles FOR SELECT TO authenticated
  USING (attacker_id = auth.uid() OR defender_id = auth.uid());

CREATE OR REPLACE FUNCTION public.set_rival_team(p_slots jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_ids text[];
  v_id text;
  v_count int;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  IF jsonb_typeof(p_slots) <> 'array' THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_slots'); END IF;
  IF jsonb_array_length(p_slots) <> 5 THEN RETURN jsonb_build_object('ok', false, 'error', 'need_five'); END IF;
  SELECT array_agg(value::text) INTO v_ids FROM jsonb_array_elements_text(p_slots) value;
  IF (SELECT COUNT(DISTINCT x) FROM unnest(v_ids) x) <> 5 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'duplicates');
  END IF;
  FOREACH v_id IN ARRAY v_ids LOOP
    SELECT 1 INTO v_count FROM public.user_collection
      WHERE user_id = v_user AND character_id = v_id LIMIT 1;
    IF v_count IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'error', 'not_owned', 'character_id', v_id);
    END IF;
    v_count := NULL;
  END LOOP;
  INSERT INTO public.rival_teams (user_id, slots, updated_at)
  VALUES (v_user, p_slots, now())
  ON CONFLICT (user_id) DO UPDATE SET slots = EXCLUDED.slots, updated_at = now();
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_rival_team()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT slots FROM public.rival_teams WHERE user_id = auth.uid()), '[]'::jsonb);
$$;

CREATE OR REPLACE FUNCTION public.get_my_rival_stats()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_row public.rival_stats%ROWTYPE;
  v_today date := (now() AT TIME ZONE 'UTC')::date;
  v_bt int;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  SELECT * INTO v_row FROM public.rival_stats WHERE user_id = v_user;
  IF v_row.user_id IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'rating', 1000, 'wins', 0, 'losses', 0,
      'battles_today', 0, 'battles_left', 10);
  END IF;
  v_bt := CASE WHEN v_row.battles_day = v_today THEN v_row.battles_today ELSE 0 END;
  RETURN jsonb_build_object('ok', true, 'rating', v_row.rating, 'wins', v_row.wins,
    'losses', v_row.losses, 'battles_today', v_bt, 'battles_left', GREATEST(0, 10 - v_bt));
END;
$$;

CREATE OR REPLACE FUNCTION public.find_rival_opponent()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_opp uuid;
  v_slots jsonb;
  v_username text;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  SELECT rt.user_id, rt.slots INTO v_opp, v_slots
  FROM public.rival_teams rt
  JOIN public.profiles p ON p.user_id = rt.user_id
  WHERE rt.user_id <> v_user AND jsonb_array_length(rt.slots) = 5 AND p.username IS NOT NULL
  ORDER BY random() LIMIT 1;
  IF v_opp IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'no_opponent'); END IF;
  SELECT username INTO v_username FROM public.profiles WHERE user_id = v_opp;
  RETURN jsonb_build_object('ok', true, 'opponent_id', v_opp, 'username', v_username, 'team', v_slots);
END;
$$;

CREATE OR REPLACE FUNCTION public.battle_rival(p_opponent uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_today date := (now() AT TIME ZONE 'UTC')::date;
  v_att_slots jsonb; v_def_slots jsonb;
  v_att_ovr int := 0; v_def_ovr int := 0;
  v_att_score numeric(6,2); v_def_score numeric(6,2);
  v_winner uuid;
  v_att_rating int; v_def_rating int;
  v_expected numeric; v_actual numeric;
  v_delta int; v_att_delta int; v_def_delta int;
  v_att_stats public.rival_stats%ROWTYPE;
  v_bt int; v_battle_id uuid; v_souls int;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  IF p_opponent IS NULL OR p_opponent = v_user THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_opponent');
  END IF;
  SELECT * INTO v_att_stats FROM public.rival_stats WHERE user_id = v_user;
  v_bt := CASE
    WHEN v_att_stats.user_id IS NULL THEN 0
    WHEN v_att_stats.battles_day = v_today THEN v_att_stats.battles_today
    ELSE 0 END;
  IF v_bt >= 10 THEN RETURN jsonb_build_object('ok', false, 'error', 'daily_limit'); END IF;

  SELECT slots INTO v_att_slots FROM public.rival_teams WHERE user_id = v_user;
  SELECT slots INTO v_def_slots FROM public.rival_teams WHERE user_id = p_opponent;
  IF v_att_slots IS NULL OR jsonb_array_length(v_att_slots) <> 5 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'need_team');
  END IF;
  IF v_def_slots IS NULL OR jsonb_array_length(v_def_slots) <> 5 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'opponent_no_team');
  END IF;

  SELECT COALESCE(SUM(cc.overall), 0) INTO v_att_ovr
  FROM jsonb_array_elements_text(v_att_slots) s
  JOIN public.characters_catalog cc ON cc.id = s.value;
  SELECT COALESCE(SUM(cc.overall), 0) INTO v_def_ovr
  FROM jsonb_array_elements_text(v_def_slots) s
  JOIN public.characters_catalog cc ON cc.id = s.value;

  v_att_score := (v_att_ovr::numeric / 5) + (random() * 20 - 5);
  v_def_score := (v_def_ovr::numeric / 5) + (random() * 20 - 5);
  v_att_score := ROUND(GREATEST(0, LEAST(120, v_att_score))::numeric, 2);
  v_def_score := ROUND(GREATEST(0, LEAST(120, v_def_score))::numeric, 2);

  IF v_att_score > v_def_score THEN v_winner := v_user;
  ELSIF v_def_score > v_att_score THEN v_winner := p_opponent;
  ELSE v_winner := NULL; END IF;

  v_att_rating := COALESCE(v_att_stats.rating, 1000);
  SELECT COALESCE(rating, 1000) INTO v_def_rating FROM public.rival_stats WHERE user_id = p_opponent;
  IF v_def_rating IS NULL THEN v_def_rating := 1000; END IF;
  v_expected := 1.0 / (1.0 + power(10.0, (v_def_rating - v_att_rating)::numeric / 400.0));
  v_actual := CASE WHEN v_winner = v_user THEN 1.0 WHEN v_winner = p_opponent THEN 0.0 ELSE 0.5 END;
  v_delta := ROUND(32.0 * (v_actual - v_expected));
  v_att_delta := v_delta; v_def_delta := -v_delta;

  INSERT INTO public.rival_stats (user_id, rating, wins, losses, battles_today, battles_day, updated_at)
  VALUES (v_user, GREATEST(0, v_att_rating + v_att_delta),
    CASE WHEN v_winner = v_user THEN 1 ELSE 0 END,
    CASE WHEN v_winner = p_opponent THEN 1 ELSE 0 END,
    v_bt + 1, v_today, now())
  ON CONFLICT (user_id) DO UPDATE SET
    rating = GREATEST(0, public.rival_stats.rating + v_att_delta),
    wins = public.rival_stats.wins + CASE WHEN v_winner = v_user THEN 1 ELSE 0 END,
    losses = public.rival_stats.losses + CASE WHEN v_winner = p_opponent THEN 1 ELSE 0 END,
    battles_today = CASE WHEN public.rival_stats.battles_day = v_today THEN public.rival_stats.battles_today + 1 ELSE 1 END,
    battles_day = v_today, updated_at = now();

  INSERT INTO public.rival_stats (user_id, rating, wins, losses, battles_today, battles_day, updated_at)
  VALUES (p_opponent, GREATEST(0, v_def_rating + v_def_delta),
    CASE WHEN v_winner = p_opponent THEN 1 ELSE 0 END,
    CASE WHEN v_winner = v_user THEN 1 ELSE 0 END,
    0, v_today, now())
  ON CONFLICT (user_id) DO UPDATE SET
    rating = GREATEST(0, public.rival_stats.rating + v_def_delta),
    wins = public.rival_stats.wins + CASE WHEN v_winner = p_opponent THEN 1 ELSE 0 END,
    losses = public.rival_stats.losses + CASE WHEN v_winner = v_user THEN 1 ELSE 0 END,
    updated_at = now();

  v_souls := CASE WHEN v_winner = v_user THEN 30 WHEN v_winner IS NULL THEN 10 ELSE 5 END;
  UPDATE public.profiles SET souls = COALESCE(souls, 0) + v_souls, updated_at = now() WHERE user_id = v_user;

  INSERT INTO public.rival_battles (attacker_id, defender_id, attacker_team, defender_team,
    attacker_score, defender_score, winner_id, attacker_delta, defender_delta)
  VALUES (v_user, p_opponent, v_att_slots, v_def_slots,
    v_att_score, v_def_score, v_winner, v_att_delta, v_def_delta)
  RETURNING id INTO v_battle_id;

  RETURN jsonb_build_object('ok', true, 'battle_id', v_battle_id,
    'attacker_score', v_att_score, 'defender_score', v_def_score,
    'winner_id', v_winner, 'attacker_delta', v_att_delta, 'defender_delta', v_def_delta,
    'new_rating', GREATEST(0, v_att_rating + v_att_delta),
    'souls_awarded', v_souls, 'battles_left', GREATEST(0, 10 - (v_bt + 1)));
END;
$$;

CREATE OR REPLACE FUNCTION public.get_rival_leaderboard(p_limit integer DEFAULT 100)
RETURNS TABLE(rank bigint, user_id uuid, username text, rating integer, wins integer, losses integer, title text, username_color text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT RANK() OVER (ORDER BY rs.rating DESC, rs.wins DESC) AS rank,
    rs.user_id, p.username, rs.rating, rs.wins, rs.losses, p.title, p.username_color
  FROM public.rival_stats rs
  JOIN public.profiles p ON p.user_id = rs.user_id
  WHERE p.username IS NOT NULL
  ORDER BY rs.rating DESC, rs.wins DESC
  LIMIT GREATEST(1, LEAST(500, p_limit));
$$;

CREATE OR REPLACE FUNCTION public.get_my_recent_battles(p_limit integer DEFAULT 20)
RETURNS TABLE(
  id uuid, created_at timestamptz, opponent_id uuid, opponent_name text,
  my_score numeric, opp_score numeric, my_delta integer, i_won boolean, i_lost boolean
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid();
BEGIN
  RETURN QUERY
  SELECT b.id, b.created_at,
    CASE WHEN b.attacker_id = v_user THEN b.defender_id ELSE b.attacker_id END,
    p.username,
    CASE WHEN b.attacker_id = v_user THEN b.attacker_score ELSE b.defender_score END,
    CASE WHEN b.attacker_id = v_user THEN b.defender_score ELSE b.attacker_score END,
    CASE WHEN b.attacker_id = v_user THEN b.attacker_delta ELSE b.defender_delta END,
    (b.winner_id = v_user),
    (b.winner_id IS NOT NULL AND b.winner_id <> v_user)
  FROM public.rival_battles b
  LEFT JOIN public.profiles p ON p.user_id = CASE WHEN b.attacker_id = v_user THEN b.defender_id ELSE b.attacker_id END
  WHERE b.attacker_id = v_user OR b.defender_id = v_user
  ORDER BY b.created_at DESC
  LIMIT GREATEST(1, LEAST(100, p_limit));
END;
$$;