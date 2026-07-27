CREATE TABLE public.weekly_reward_claims (
  user_id uuid NOT NULL,
  season_key text NOT NULL,
  rank integer NOT NULL,
  souls_awarded integer NOT NULL DEFAULT 0,
  pack_tier text,
  claimed_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, season_key)
);

GRANT SELECT ON public.weekly_reward_claims TO authenticated;
GRANT ALL ON public.weekly_reward_claims TO service_role;

ALTER TABLE public.weekly_reward_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own claims readable" ON public.weekly_reward_claims
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.previous_season_key()
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT to_char((now() AT TIME ZONE 'UTC') - interval '7 days', 'IYYY"-W"IW');
$$;

CREATE OR REPLACE FUNCTION public.weekly_reward_for_rank(p_rank integer)
RETURNS jsonb LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN p_rank = 1 THEN jsonb_build_object('souls', 500, 'pack', 'legend')
    WHEN p_rank BETWEEN 2 AND 3 THEN jsonb_build_object('souls', 300, 'pack', 'ultra')
    WHEN p_rank BETWEEN 4 AND 10 THEN jsonb_build_object('souls', 200, 'pack', 'gold')
    WHEN p_rank BETWEEN 11 AND 25 THEN jsonb_build_object('souls', 100, 'pack', 'silver')
    WHEN p_rank BETWEEN 26 AND 100 THEN jsonb_build_object('souls', 50, 'pack', 'bronze')
    WHEN p_rank IS NOT NULL THEN jsonb_build_object('souls', 25, 'pack', null)
    ELSE jsonb_build_object('souls', 0, 'pack', null)
  END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_weekly_reward()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_season text := public.previous_season_key();
  v_rank int;
  v_reward jsonb;
  v_claimed boolean;
  v_score numeric;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;

  SELECT true INTO v_claimed FROM public.weekly_reward_claims
    WHERE user_id = v_user AND season_key = v_season;
  v_claimed := COALESCE(v_claimed, false);

  WITH ranked AS (
    SELECT user_id, score, RANK() OVER (ORDER BY score DESC) AS r
    FROM public.leaderboard_scores WHERE season_key = v_season
  )
  SELECT r, score INTO v_rank, v_score FROM ranked WHERE user_id = v_user;

  v_reward := public.weekly_reward_for_rank(v_rank);

  RETURN jsonb_build_object(
    'ok', true,
    'season', v_season,
    'rank', v_rank,
    'score', v_score,
    'souls', (v_reward->>'souls')::int,
    'pack', v_reward->>'pack',
    'claimed', v_claimed,
    'has_entry', v_rank IS NOT NULL
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_weekly_reward()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_season text := public.previous_season_key();
  v_rank int;
  v_reward jsonb;
  v_souls int;
  v_pack text;
  v_exists boolean;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;

  SELECT true INTO v_exists FROM public.weekly_reward_claims
    WHERE user_id = v_user AND season_key = v_season;
  IF COALESCE(v_exists, false) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_claimed');
  END IF;

  WITH ranked AS (
    SELECT user_id, RANK() OVER (ORDER BY score DESC) AS r
    FROM public.leaderboard_scores WHERE season_key = v_season
  )
  SELECT r INTO v_rank FROM ranked WHERE user_id = v_user;

  IF v_rank IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_entry');
  END IF;

  v_reward := public.weekly_reward_for_rank(v_rank);
  v_souls := (v_reward->>'souls')::int;
  v_pack := v_reward->>'pack';

  IF v_souls > 0 THEN
    UPDATE public.profiles SET souls = COALESCE(souls, 0) + v_souls, updated_at = now()
      WHERE user_id = v_user;
  END IF;

  IF v_pack IS NOT NULL THEN
    INSERT INTO public.user_packs (user_id, tier, count) VALUES (v_user, v_pack, 1)
      ON CONFLICT (user_id, tier) DO UPDATE SET count = public.user_packs.count + 1;
  END IF;

  INSERT INTO public.weekly_reward_claims (user_id, season_key, rank, souls_awarded, pack_tier)
    VALUES (v_user, v_season, v_rank, v_souls, v_pack);

  RETURN jsonb_build_object('ok', true, 'rank', v_rank, 'souls', v_souls, 'pack', v_pack, 'season', v_season);
END;
$$;