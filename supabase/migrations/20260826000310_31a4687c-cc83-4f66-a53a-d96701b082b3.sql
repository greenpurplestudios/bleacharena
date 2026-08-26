DROP FUNCTION IF EXISTS public.get_leaderboard(text, integer);

CREATE OR REPLACE FUNCTION public.get_leaderboard(p_season text DEFAULT NULL::text, p_limit integer DEFAULT 100)
 RETURNS TABLE(rank bigint, user_id uuid, username text, score numeric, team jsonb, title text, username_color text, name_frame text, avatar_character_id text, name_effect text, profile_frame text, profile_badge text, leaderboard_style text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH s AS (
    SELECT ls.user_id, ls.score, ls.team
    FROM public.leaderboard_scores ls
    WHERE ls.season_key = COALESCE(p_season, public.current_season_key())
  )
  SELECT RANK() OVER (ORDER BY s.score DESC) AS rank, s.user_id, p.username, s.score, s.team,
    p.title, p.username_color, p.name_frame, p.avatar_character_id,
    p.name_effect, p.profile_frame, p.profile_badge, p.leaderboard_style
  FROM s JOIN public.profiles p ON p.user_id = s.user_id
  WHERE p.username IS NOT NULL
  ORDER BY s.score DESC, p.username ASC
  LIMIT GREATEST(1, LEAST(500, p_limit));
$function$;

REVOKE EXECUTE ON FUNCTION public.get_leaderboard(text, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(text, integer) TO authenticated;