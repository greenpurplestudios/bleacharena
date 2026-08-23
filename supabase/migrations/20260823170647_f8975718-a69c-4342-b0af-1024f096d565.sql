CREATE OR REPLACE FUNCTION public.get_my_profile_full()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_p public.profiles%ROWTYPE;
  v_lvl public.player_levels%ROWTYPE;
  v_coll integer; v_catalog integer;
  v_rival public.rival_stats%ROWTYPE;
  v_bd public.bleachdle_stats%ROWTYPE;
  v_recent jsonb;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  SELECT * INTO v_p FROM public.profiles WHERE user_id = v_user;
  SELECT * INTO v_lvl FROM public.player_levels WHERE user_id = v_user;
  SELECT COUNT(*) INTO v_coll FROM public.user_collection WHERE user_id = v_user;
  SELECT COUNT(*) INTO v_catalog FROM public.characters_catalog;
  SELECT * INTO v_rival FROM public.rival_stats WHERE user_id = v_user;
  SELECT * INTO v_bd FROM public.bleachdle_stats WHERE user_id = v_user;

  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_recent FROM (
    SELECT c.id, c.name_en, c.name_ar, c.rarity, ua.unlocked_at
    FROM public.user_achievements ua
    JOIN public.achievements_catalog c ON c.id = ua.achievement_id
    WHERE ua.user_id = v_user AND ua.unlocked_at IS NOT NULL
    ORDER BY ua.unlocked_at DESC LIMIT 5
  ) t;

  RETURN jsonb_build_object('ok', true,
    'user_id', v_user,
    'username', v_p.username, 'title', v_p.title, 'username_color', v_p.username_color,
    'avatar_character_id', v_p.avatar_character_id,
    'favorite_character_id', v_p.favorite_character_id,
    'profile_frame', v_p.profile_frame, 'profile_border', v_p.profile_border,
    'name_frame', v_p.name_frame,
    'name_effect', v_p.name_effect, 'profile_badge', v_p.profile_badge,
    'leaderboard_style', v_p.leaderboard_style,
    'souls', v_p.souls, 'total_souls_earned', v_p.total_souls_earned,
    'packs_opened', v_p.packs_opened, 'drafts_played', v_p.drafts_played,
    'best_draft_score', v_p.best_draft_score, 'highest_rival_rating', v_p.highest_rival_rating,
    'play_seconds', v_p.play_seconds, 'created_at', v_p.created_at,
    'level', COALESCE(v_lvl.level, 1), 'xp', COALESCE(v_lvl.xp, 0),
    'total_xp', COALESCE(v_lvl.total_xp, 0), 'xp_to_next', public.xp_for_level(COALESCE(v_lvl.level, 1)),
    'collection_owned', v_coll, 'collection_total', v_catalog,
    'rival_rating', COALESCE(v_rival.rating, 1000),
    'rival_wins', COALESCE(v_rival.wins, 0), 'rival_losses', COALESCE(v_rival.losses, 0),
    'bleachdle_best_streak', COALESCE(v_bd.best_streak, 0),
    'bleachdle_current_streak', COALESCE(v_bd.current_streak, 0),
    'recent_achievements', v_recent
  );
END; $function$;

CREATE OR REPLACE FUNCTION public.get_public_profile(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_p public.profiles%ROWTYPE;
  v_lvl public.player_levels%ROWTYPE;
  v_coll integer; v_catalog integer;
  v_rival public.rival_stats%ROWTYPE;
  v_bd public.bleachdle_stats%ROWTYPE;
  v_recent jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  SELECT * INTO v_p FROM public.profiles WHERE user_id = p_user_id;
  IF NOT FOUND OR v_p.username IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'not_found'); END IF;
  SELECT * INTO v_lvl FROM public.player_levels WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_coll FROM public.user_collection WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_catalog FROM public.characters_catalog;
  SELECT * INTO v_rival FROM public.rival_stats WHERE user_id = p_user_id;
  SELECT * INTO v_bd FROM public.bleachdle_stats WHERE user_id = p_user_id;

  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_recent FROM (
    SELECT c.id, c.name_en, c.name_ar, c.rarity, ua.unlocked_at
    FROM public.user_achievements ua
    JOIN public.achievements_catalog c ON c.id = ua.achievement_id
    WHERE ua.user_id = p_user_id AND ua.unlocked_at IS NOT NULL
    ORDER BY ua.unlocked_at DESC LIMIT 5
  ) t;

  RETURN jsonb_build_object('ok', true,
    'user_id', p_user_id,
    'username', v_p.username, 'title', v_p.title, 'username_color', v_p.username_color,
    'avatar_character_id', v_p.avatar_character_id,
    'favorite_character_id', v_p.favorite_character_id,
    'profile_frame', v_p.profile_frame, 'profile_border', v_p.profile_border,
    'name_frame', v_p.name_frame,
    'name_effect', v_p.name_effect, 'profile_badge', v_p.profile_badge,
    'leaderboard_style', v_p.leaderboard_style,
    'souls', 0, 'total_souls_earned', v_p.total_souls_earned,
    'packs_opened', v_p.packs_opened, 'drafts_played', v_p.drafts_played,
    'best_draft_score', v_p.best_draft_score, 'highest_rival_rating', v_p.highest_rival_rating,
    'play_seconds', v_p.play_seconds, 'created_at', v_p.created_at,
    'level', COALESCE(v_lvl.level, 1), 'xp', COALESCE(v_lvl.xp, 0),
    'total_xp', COALESCE(v_lvl.total_xp, 0), 'xp_to_next', public.xp_for_level(COALESCE(v_lvl.level, 1)),
    'collection_owned', v_coll, 'collection_total', v_catalog,
    'rival_rating', COALESCE(v_rival.rating, 1000),
    'rival_wins', COALESCE(v_rival.wins, 0), 'rival_losses', COALESCE(v_rival.losses, 0),
    'bleachdle_best_streak', COALESCE(v_bd.best_streak, 0),
    'bleachdle_current_streak', COALESCE(v_bd.current_streak, 0),
    'recent_achievements', v_recent
  );
END; $function$;