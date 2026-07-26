
ALTER TABLE public.leaderboard_scores
  ADD COLUMN IF NOT EXISTS team jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE OR REPLACE FUNCTION public.submit_score(p_score numeric, p_team jsonb DEFAULT '[]'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_season text := public.current_season_key();
  v_score numeric(5,2);
  v_existing numeric(5,2);
  v_username text;
  v_team jsonb := COALESCE(p_team, '[]'::jsonb);
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated');
  END IF;

  IF p_score IS NULL OR p_score <> p_score THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_score');
  END IF;

  IF jsonb_typeof(v_team) <> 'array' OR jsonb_array_length(v_team) > 10 THEN
    v_team := '[]'::jsonb;
  END IF;

  v_score := GREATEST(0, LEAST(100, p_score))::numeric(5,2);

  SELECT username INTO v_username FROM public.profiles WHERE user_id = v_user;
  IF v_username IS NULL OR length(trim(v_username)) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'needs_username', true);
  END IF;

  SELECT score INTO v_existing
  FROM public.leaderboard_scores
  WHERE user_id = v_user AND season_key = v_season;

  IF v_existing IS NULL THEN
    INSERT INTO public.leaderboard_scores (user_id, season_key, score, team)
    VALUES (v_user, v_season, v_score, v_team);
    RETURN jsonb_build_object('ok', true, 'score', v_score, 'improved', true, 'season', v_season);
  ELSIF v_score > v_existing THEN
    UPDATE public.leaderboard_scores
    SET score = v_score, team = v_team, submitted_at = now()
    WHERE user_id = v_user AND season_key = v_season;
    RETURN jsonb_build_object('ok', true, 'score', v_score, 'improved', true, 'season', v_season);
  ELSE
    RETURN jsonb_build_object('ok', true, 'score', v_existing, 'improved', false, 'season', v_season);
  END IF;
END;
$function$;

DROP FUNCTION IF EXISTS public.get_leaderboard(text, integer);
CREATE OR REPLACE FUNCTION public.get_leaderboard(p_season text DEFAULT NULL::text, p_limit integer DEFAULT 100)
 RETURNS TABLE(rank bigint, user_id uuid, username text, score numeric, team jsonb)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH s AS (
    SELECT ls.user_id, ls.score, ls.team
    FROM public.leaderboard_scores ls
    WHERE ls.season_key = COALESCE(p_season, public.current_season_key())
  )
  SELECT
    RANK() OVER (ORDER BY s.score DESC) AS rank,
    s.user_id,
    p.username,
    s.score,
    s.team
  FROM s
  JOIN public.profiles p ON p.user_id = s.user_id
  WHERE p.username IS NOT NULL
  ORDER BY s.score DESC, p.username ASC
  LIMIT GREATEST(1, LEAST(500, p_limit));
$function$;
