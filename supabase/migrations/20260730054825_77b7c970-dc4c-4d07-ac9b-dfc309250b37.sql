-- 1) Realtime clan chat
CREATE POLICY "clan members read clan messages" ON public.clan_messages
  FOR SELECT TO authenticated
  USING (clan_id = public.my_clan_id());

GRANT SELECT ON public.clan_messages TO authenticated;
GRANT ALL ON public.clan_messages TO service_role;

ALTER TABLE public.clan_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clan_messages;

-- 2) Weekly clan leaderboard
CREATE OR REPLACE FUNCTION public.get_clan_weekly_leaderboard(p_season text DEFAULT NULL, p_limit integer DEFAULT 100)
RETURNS TABLE(rank bigint, id uuid, tag text, name text, member_count integer, total_score numeric, scoring_members bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH season AS (SELECT COALESCE(p_season, public.current_season_key()) AS key),
  best AS (
    SELECT ls.user_id, MAX(ls.score) AS best_score
    FROM public.leaderboard_scores ls, season s
    WHERE ls.season_key = s.key
    GROUP BY ls.user_id
  ),
  agg AS (
    SELECT c.id, c.tag, c.name, c.member_count,
      COALESCE(SUM(b.best_score), 0)::numeric AS total_score,
      COUNT(b.user_id)::bigint AS scoring_members
    FROM public.clans c
    LEFT JOIN public.clan_members cm ON cm.clan_id = c.id
    LEFT JOIN best b ON b.user_id = cm.user_id
    GROUP BY c.id
  )
  SELECT RANK() OVER (ORDER BY total_score DESC, member_count ASC) AS rank,
    id, tag, name, member_count, total_score, scoring_members
  FROM agg
  ORDER BY total_score DESC, member_count ASC
  LIMIT GREATEST(1, LEAST(500, p_limit));
$$;

-- 3) Clan weekly rewards
CREATE TABLE public.clan_weekly_reward_claims (
  user_id uuid NOT NULL,
  season_key text NOT NULL,
  clan_id uuid NOT NULL,
  rank integer NOT NULL,
  souls_awarded integer NOT NULL DEFAULT 0,
  pack_tier text,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, season_key)
);

GRANT SELECT ON public.clan_weekly_reward_claims TO authenticated;
GRANT ALL ON public.clan_weekly_reward_claims TO service_role;

ALTER TABLE public.clan_weekly_reward_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own clan reward claims readable" ON public.clan_weekly_reward_claims
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.clan_weekly_reward_for_rank(p_rank integer)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_rank IS NULL THEN jsonb_build_object('souls', 0, 'pack', NULL)
    WHEN p_rank = 1 THEN jsonb_build_object('souls', 400, 'pack', 'ultra')
    WHEN p_rank <= 3 THEN jsonb_build_object('souls', 250, 'pack', 'gold')
    WHEN p_rank <= 10 THEN jsonb_build_object('souls', 150, 'pack', 'silver')
    WHEN p_rank <= 25 THEN jsonb_build_object('souls', 75, 'pack', 'bronze')
    ELSE jsonb_build_object('souls', 25, 'pack', NULL)
  END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_clan_weekly_reward()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_season text := public.previous_season_key();
  v_clan uuid := public.my_clan_id();
  v_rank int;
  v_score numeric;
  v_reward jsonb;
  v_claimed boolean;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;

  SELECT true INTO v_claimed FROM public.clan_weekly_reward_claims
    WHERE user_id = v_user AND season_key = v_season;
  v_claimed := COALESCE(v_claimed, false);

  IF v_clan IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'season', v_season, 'in_clan', false,
      'rank', NULL, 'score', NULL, 'souls', 0, 'pack', NULL, 'claimed', v_claimed, 'has_entry', false);
  END IF;

  SELECT l.rank, l.total_score INTO v_rank, v_score
  FROM public.get_clan_weekly_leaderboard(v_season, 500) l
  WHERE l.id = v_clan;

  IF COALESCE(v_score, 0) <= 0 THEN v_rank := NULL; END IF;
  v_reward := public.clan_weekly_reward_for_rank(v_rank);

  RETURN jsonb_build_object(
    'ok', true, 'season', v_season, 'in_clan', true,
    'rank', v_rank, 'score', v_score,
    'souls', (v_reward->>'souls')::int, 'pack', v_reward->>'pack',
    'claimed', v_claimed, 'has_entry', v_rank IS NOT NULL
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_clan_weekly_reward()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_season text := public.previous_season_key();
  v_clan uuid := public.my_clan_id();
  v_rank int;
  v_score numeric;
  v_reward jsonb;
  v_souls int;
  v_pack text;
  v_exists boolean;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  IF v_clan IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'not_in_clan'); END IF;

  SELECT true INTO v_exists FROM public.clan_weekly_reward_claims
    WHERE user_id = v_user AND season_key = v_season;
  IF COALESCE(v_exists, false) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_claimed');
  END IF;

  SELECT l.rank, l.total_score INTO v_rank, v_score
  FROM public.get_clan_weekly_leaderboard(v_season, 500) l
  WHERE l.id = v_clan;

  IF v_rank IS NULL OR COALESCE(v_score, 0) <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_entry');
  END IF;

  v_reward := public.clan_weekly_reward_for_rank(v_rank);
  v_souls := (v_reward->>'souls')::int;
  v_pack := v_reward->>'pack';

  IF v_souls > 0 THEN
    UPDATE public.profiles
      SET souls = COALESCE(souls, 0) + v_souls,
          total_souls_earned = COALESCE(total_souls_earned, 0) + v_souls,
          updated_at = now()
      WHERE user_id = v_user;
  END IF;

  IF v_pack IS NOT NULL THEN
    INSERT INTO public.user_packs (user_id, tier, count) VALUES (v_user, v_pack, 1)
      ON CONFLICT (user_id, tier) DO UPDATE SET count = public.user_packs.count + 1;
  END IF;

  INSERT INTO public.clan_weekly_reward_claims (user_id, season_key, clan_id, rank, souls_awarded, pack_tier)
    VALUES (v_user, v_season, v_clan, v_rank, v_souls, v_pack);

  RETURN jsonb_build_object('ok', true, 'rank', v_rank, 'souls', v_souls, 'pack', v_pack, 'season', v_season);
END;
$$;

-- 4) Open all packs of a tier
CREATE OR REPLACE FUNCTION public.open_all_packs(p_tier text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_have int;
  v_i int := 0;
  v_res jsonb;
  v_results jsonb := '[]'::jsonb;
  v_souls int := 0;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;

  SELECT count INTO v_have FROM public.user_packs WHERE user_id = v_user AND tier = p_tier;
  IF COALESCE(v_have, 0) < 1 THEN RETURN jsonb_build_object('ok', false, 'error', 'no_packs'); END IF;

  v_have := LEAST(v_have, 50);

  WHILE v_i < v_have LOOP
    v_res := public.open_pack(p_tier);
    EXIT WHEN NOT COALESCE((v_res->>'ok')::boolean, false);
    v_results := v_results || jsonb_build_array(v_res);
    v_souls := v_souls + COALESCE((v_res->>'souls_awarded')::int, 0);
    v_i := v_i + 1;
  END LOOP;

  IF jsonb_array_length(v_results) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_packs');
  END IF;

  RETURN jsonb_build_object('ok', true, 'opened', jsonb_array_length(v_results),
    'souls_awarded', v_souls, 'results', v_results);
END;
$$;