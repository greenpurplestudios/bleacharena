
-- 1) app_role enum
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own roles readable" ON public.user_roles;
CREATE POLICY "own roles readable" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 3) has_role security definer helper
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Admins manage roles (via app)
DROP POLICY IF EXISTS "admins manage roles" ON public.user_roles;
CREATE POLICY "admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4) Rivals per-opponent anti-farm
CREATE TABLE IF NOT EXISTS public.rival_daily_matches (
  attacker_id uuid NOT NULL,
  defender_id uuid NOT NULL,
  day date NOT NULL DEFAULT ((now() AT TIME ZONE 'UTC')::date),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (attacker_id, defender_id, day)
);

GRANT SELECT ON public.rival_daily_matches TO authenticated;
GRANT ALL ON public.rival_daily_matches TO service_role;

ALTER TABLE public.rival_daily_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own daily matches readable" ON public.rival_daily_matches;
CREATE POLICY "own daily matches readable" ON public.rival_daily_matches
  FOR SELECT TO authenticated
  USING (attacker_id = auth.uid() OR defender_id = auth.uid());

-- 5) Patch battle_rival to block repeats vs same opponent per day, and record pairing
CREATE OR REPLACE FUNCTION public.battle_rival(p_opponent uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  v_already boolean;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  IF p_opponent IS NULL OR p_opponent = v_user THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_opponent');
  END IF;

  -- Anti-farm: only once per opponent per day
  SELECT true INTO v_already FROM public.rival_daily_matches
    WHERE attacker_id = v_user AND defender_id = p_opponent AND day = v_today;
  IF COALESCE(v_already, false) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_fought_today');
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

  -- Record daily pairing (anti-farm)
  INSERT INTO public.rival_daily_matches (attacker_id, defender_id, day)
    VALUES (v_user, p_opponent, v_today)
    ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object('ok', true, 'battle_id', v_battle_id,
    'attacker_score', v_att_score, 'defender_score', v_def_score,
    'winner_id', v_winner, 'attacker_delta', v_att_delta, 'defender_delta', v_def_delta,
    'new_rating', GREATEST(0, v_att_rating + v_att_delta),
    'souls_awarded', v_souls, 'battles_left', GREATEST(0, 10 - (v_bt + 1)));
END;
$function$;

-- 6) find_rival_opponent: skip opponents already fought today
CREATE OR REPLACE FUNCTION public.find_rival_opponent()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_today date := (now() AT TIME ZONE 'UTC')::date;
  v_opp uuid;
  v_slots jsonb;
  v_username text;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  SELECT rt.user_id, rt.slots INTO v_opp, v_slots
  FROM public.rival_teams rt
  JOIN public.profiles p ON p.user_id = rt.user_id
  WHERE rt.user_id <> v_user
    AND jsonb_array_length(rt.slots) = 5
    AND p.username IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.rival_daily_matches m
      WHERE m.attacker_id = v_user AND m.defender_id = rt.user_id AND m.day = v_today
    )
  ORDER BY random() LIMIT 1;
  IF v_opp IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'no_opponent'); END IF;
  SELECT username INTO v_username FROM public.profiles WHERE user_id = v_opp;
  RETURN jsonb_build_object('ok', true, 'opponent_id', v_opp, 'username', v_username, 'team', v_slots);
END;
$function$;

-- 7) Add gender column to characters_catalog (used for Bleachdle gender hint)
ALTER TABLE public.characters_catalog
  ADD COLUMN IF NOT EXISTS gender text NOT NULL DEFAULT 'unknown';

-- 8) Seed admin role for the developer, if the account exists
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users
WHERE lower(email) = 'qaisalsheikh110@gmail.com'
ON CONFLICT DO NOTHING;
