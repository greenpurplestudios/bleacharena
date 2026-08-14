-- Admin role for QM
INSERT INTO public.user_roles (user_id, role)
VALUES ('c2f01eb9-8b22-4641-afcc-0e2e087da050', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Audit log
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action text NOT NULL,
  target_user_id uuid,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins read audit log" ON public.admin_audit_log;
CREATE POLICY "admins read audit log" ON public.admin_audit_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS admin_audit_log_created_idx ON public.admin_audit_log (created_at DESC);

-- Guard helper
CREATE OR REPLACE FUNCTION public.admin_guard()
RETURNS uuid LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL OR NOT public.has_role(v_user, 'admin') THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  RETURN v_user;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_log(_admin uuid, _action text, _target uuid, _details jsonb)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.admin_audit_log (admin_id, action, target_user_id, details)
  VALUES (_admin, _action, _target, COALESCE(_details, '{}'::jsonb));
$$;

-- Is the caller an admin? (safe for the client to call)
CREATE OR REPLACE FUNCTION public.am_i_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin');
$$;

-- Search players
CREATE OR REPLACE FUNCTION public.admin_search_players(p_q text DEFAULT '', p_limit integer DEFAULT 25)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_admin uuid := public.admin_guard();
BEGIN
  RETURN COALESCE((
    SELECT jsonb_agg(x ORDER BY x->>'username')
    FROM (
      SELECT jsonb_build_object(
        'user_id', p.user_id, 'username', p.username, 'souls', p.souls,
        'level', COALESCE(l.level, 1), 'created_at', p.created_at,
        'is_admin', public.has_role(p.user_id, 'admin')
      ) AS x
      FROM public.profiles p
      LEFT JOIN public.player_levels l ON l.user_id = p.user_id
      WHERE COALESCE(p_q, '') = '' OR p.username ILIKE '%' || p_q || '%'
      ORDER BY p.username
      LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 25), 100))
    ) s
  ), '[]'::jsonb);
END; $$;

-- Player summary
CREATE OR REPLACE FUNCTION public.admin_get_player(p_user uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_admin uuid := public.admin_guard();
BEGIN
  RETURN jsonb_build_object(
    'profile', (SELECT to_jsonb(p) FROM public.profiles p WHERE p.user_id = p_user),
    'level', (SELECT to_jsonb(l) FROM public.player_levels l WHERE l.user_id = p_user),
    'packs', COALESCE((SELECT jsonb_agg(jsonb_build_object('tier', tier, 'count', count)) FROM public.user_packs WHERE user_id = p_user), '[]'::jsonb),
    'cards', COALESCE((SELECT count(*) FROM public.user_collection WHERE user_id = p_user), 0),
    'items', COALESCE((SELECT count(*) FROM public.user_inventory WHERE user_id = p_user), 0),
    'achievements', COALESCE((SELECT count(*) FROM public.user_achievements WHERE user_id = p_user AND unlocked_at IS NOT NULL), 0),
    'daily', (SELECT to_jsonb(d) FROM public.daily_login d WHERE d.user_id = p_user),
    'rival', (SELECT to_jsonb(r) FROM public.rival_stats r WHERE r.user_id = p_user),
    'is_admin', public.has_role(p_user, 'admin')
  );
END; $$;

-- Grant souls
CREATE OR REPLACE FUNCTION public.admin_grant_souls(p_user uuid, p_amount integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_admin uuid := public.admin_guard(); v_new integer;
BEGIN
  UPDATE public.profiles
    SET souls = GREATEST(0, COALESCE(souls,0) + p_amount),
        total_souls_earned = COALESCE(total_souls_earned,0) + GREATEST(0, p_amount),
        updated_at = now()
    WHERE user_id = p_user
    RETURNING souls INTO v_new;
  IF v_new IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'no_profile'); END IF;
  PERFORM public.admin_log(v_admin, 'grant_souls', p_user, jsonb_build_object('amount', p_amount, 'new_total', v_new));
  RETURN jsonb_build_object('ok', true, 'souls', v_new);
END; $$;

-- Grant XP (re-uses the level curve)
CREATE OR REPLACE FUNCTION public.admin_grant_xp(p_user uuid, p_amount integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_admin uuid := public.admin_guard(); v_row public.player_levels%ROWTYPE; v_need integer;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN RETURN jsonb_build_object('ok', false, 'error', 'bad_amount'); END IF;
  INSERT INTO public.player_levels (user_id, level, xp, total_xp) VALUES (p_user, 1, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;
  SELECT * INTO v_row FROM public.player_levels WHERE user_id = p_user FOR UPDATE;
  v_row.xp := v_row.xp + p_amount;
  v_row.total_xp := v_row.total_xp + p_amount;
  LOOP
    v_need := public.xp_for_level(v_row.level);
    EXIT WHEN v_row.xp < v_need;
    v_row.xp := v_row.xp - v_need;
    v_row.level := v_row.level + 1;
  END LOOP;
  UPDATE public.player_levels SET level = v_row.level, xp = v_row.xp, total_xp = v_row.total_xp, updated_at = now()
    WHERE user_id = p_user;
  PERFORM public.admin_log(v_admin, 'grant_xp', p_user, jsonb_build_object('amount', p_amount, 'level', v_row.level));
  RETURN jsonb_build_object('ok', true, 'level', v_row.level, 'xp', v_row.xp);
END; $$;

-- Grant packs
CREATE OR REPLACE FUNCTION public.admin_grant_pack(p_user uuid, p_tier text, p_count integer DEFAULT 1)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_admin uuid := public.admin_guard();
BEGIN
  IF p_tier NOT IN ('bronze','silver','gold','legend') THEN RETURN jsonb_build_object('ok', false, 'error', 'bad_tier'); END IF;
  INSERT INTO public.user_packs (user_id, tier, count) VALUES (p_user, p_tier, GREATEST(1, COALESCE(p_count,1)))
    ON CONFLICT (user_id, tier) DO UPDATE SET count = public.user_packs.count + GREATEST(1, COALESCE(p_count,1));
  PERFORM public.admin_log(v_admin, 'grant_pack', p_user, jsonb_build_object('tier', p_tier, 'count', p_count));
  RETURN jsonb_build_object('ok', true);
END; $$;

-- Grant character
CREATE OR REPLACE FUNCTION public.admin_grant_character(p_user uuid, p_character text, p_count integer DEFAULT 1)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_admin uuid := public.admin_guard();
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.characters_catalog WHERE id = p_character) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unknown_character');
  END IF;
  INSERT INTO public.user_collection (user_id, character_id, count)
  VALUES (p_user, p_character, GREATEST(1, COALESCE(p_count,1)))
  ON CONFLICT (user_id, character_id) DO UPDATE SET count = public.user_collection.count + GREATEST(1, COALESCE(p_count,1));
  PERFORM public.admin_log(v_admin, 'grant_character', p_user, jsonb_build_object('character', p_character, 'count', p_count));
  RETURN jsonb_build_object('ok', true);
END; $$;

-- Grant store item
CREATE OR REPLACE FUNCTION public.admin_grant_item(p_user uuid, p_item text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_admin uuid := public.admin_guard();
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.store_items WHERE id = p_item) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unknown_item');
  END IF;
  INSERT INTO public.user_inventory (user_id, item_id) VALUES (p_user, p_item) ON CONFLICT DO NOTHING;
  PERFORM public.admin_log(v_admin, 'grant_item', p_user, jsonb_build_object('item', p_item));
  RETURN jsonb_build_object('ok', true);
END; $$;

-- Unlock achievement
CREATE OR REPLACE FUNCTION public.admin_unlock_achievement(p_user uuid, p_achievement text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_admin uuid := public.admin_guard(); v_target integer;
BEGIN
  SELECT target INTO v_target FROM public.achievements_catalog WHERE id = p_achievement;
  IF v_target IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unknown_achievement'); END IF;
  INSERT INTO public.user_achievements (user_id, achievement_id, progress, unlocked_at)
  VALUES (p_user, p_achievement, v_target, now())
  ON CONFLICT (user_id, achievement_id) DO UPDATE
    SET progress = GREATEST(public.user_achievements.progress, v_target),
        unlocked_at = COALESCE(public.user_achievements.unlocked_at, now()),
        updated_at = now();
  PERFORM public.admin_log(v_admin, 'unlock_achievement', p_user, jsonb_build_object('achievement', p_achievement));
  RETURN jsonb_build_object('ok', true);
END; $$;

-- Set daily-login streak
CREATE OR REPLACE FUNCTION public.admin_set_streak(p_user uuid, p_streak integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_admin uuid := public.admin_guard();
BEGIN
  INSERT INTO public.daily_login (user_id, streak, total_claims) VALUES (p_user, GREATEST(0, COALESCE(p_streak,0)), 0)
  ON CONFLICT (user_id) DO UPDATE SET streak = GREATEST(0, COALESCE(p_streak,0)), updated_at = now();
  PERFORM public.admin_log(v_admin, 'set_streak', p_user, jsonb_build_object('streak', p_streak));
  RETURN jsonb_build_object('ok', true);
END; $$;

-- Transfer / merge progress between two accounts (non-destructive: takes the best of both)
CREATE OR REPLACE FUNCTION public.admin_transfer_progress(p_from uuid, p_to uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_admin uuid := public.admin_guard();
BEGIN
  IF p_from IS NULL OR p_to IS NULL OR p_from = p_to THEN
    RETURN jsonb_build_object('ok', false, 'error', 'bad_args');
  END IF;
  PERFORM public.transfer_progress_internal(p_from, p_to);
  PERFORM public.admin_log(v_admin, 'transfer_progress', p_to, jsonb_build_object('from', p_from));
  RETURN jsonb_build_object('ok', true);
END; $$;

CREATE OR REPLACE FUNCTION public.transfer_progress_internal(p_from uuid, p_to uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Cards
  INSERT INTO public.user_collection (user_id, character_id, count, first_obtained_at)
  SELECT p_to, character_id, count, first_obtained_at FROM public.user_collection WHERE user_id = p_from
  ON CONFLICT (user_id, character_id) DO UPDATE
    SET count = GREATEST(public.user_collection.count, EXCLUDED.count),
        first_obtained_at = LEAST(public.user_collection.first_obtained_at, EXCLUDED.first_obtained_at);

  -- Packs
  INSERT INTO public.user_packs (user_id, tier, count)
  SELECT p_to, tier, count FROM public.user_packs WHERE user_id = p_from
  ON CONFLICT (user_id, tier) DO UPDATE SET count = public.user_packs.count + EXCLUDED.count;

  -- Inventory / potions
  INSERT INTO public.user_inventory (user_id, item_id)
  SELECT p_to, item_id FROM public.user_inventory WHERE user_id = p_from
  ON CONFLICT DO NOTHING;

  INSERT INTO public.user_potions (user_id, item_id, count)
  SELECT p_to, item_id, count FROM public.user_potions WHERE user_id = p_from
  ON CONFLICT (user_id, item_id) DO UPDATE SET count = public.user_potions.count + EXCLUDED.count;

  -- Achievements
  INSERT INTO public.user_achievements (user_id, achievement_id, progress, unlocked_at)
  SELECT p_to, achievement_id, progress, unlocked_at FROM public.user_achievements WHERE user_id = p_from
  ON CONFLICT (user_id, achievement_id) DO UPDATE
    SET progress = GREATEST(public.user_achievements.progress, EXCLUDED.progress),
        unlocked_at = COALESCE(public.user_achievements.unlocked_at, EXCLUDED.unlocked_at),
        updated_at = now();

  -- Level / XP (keep the higher total)
  INSERT INTO public.player_levels (user_id, level, xp, total_xp)
  SELECT p_to, level, xp, total_xp FROM public.player_levels WHERE user_id = p_from
  ON CONFLICT (user_id) DO UPDATE
    SET level = GREATEST(public.player_levels.level, EXCLUDED.level),
        xp = GREATEST(public.player_levels.xp, EXCLUDED.xp),
        total_xp = GREATEST(public.player_levels.total_xp, EXCLUDED.total_xp),
        updated_at = now();

  -- Daily login streak
  INSERT INTO public.daily_login (user_id, streak, last_claim_day, total_claims)
  SELECT p_to, streak, last_claim_day, total_claims FROM public.daily_login WHERE user_id = p_from
  ON CONFLICT (user_id) DO UPDATE
    SET streak = GREATEST(public.daily_login.streak, EXCLUDED.streak),
        total_claims = GREATEST(public.daily_login.total_claims, EXCLUDED.total_claims),
        last_claim_day = GREATEST(COALESCE(public.daily_login.last_claim_day, ''), COALESCE(EXCLUDED.last_claim_day, '')),
        updated_at = now();

  -- Bleachdle stats
  INSERT INTO public.bleachdle_stats (user_id, games_played, games_won, current_streak, best_streak, total_guesses, fastest_solve, last_played_day)
  SELECT p_to, games_played, games_won, current_streak, best_streak, total_guesses, fastest_solve, last_played_day
    FROM public.bleachdle_stats WHERE user_id = p_from
  ON CONFLICT (user_id) DO UPDATE
    SET games_played = GREATEST(public.bleachdle_stats.games_played, EXCLUDED.games_played),
        games_won = GREATEST(public.bleachdle_stats.games_won, EXCLUDED.games_won),
        current_streak = GREATEST(public.bleachdle_stats.current_streak, EXCLUDED.current_streak),
        best_streak = GREATEST(public.bleachdle_stats.best_streak, EXCLUDED.best_streak),
        total_guesses = GREATEST(public.bleachdle_stats.total_guesses, EXCLUDED.total_guesses),
        updated_at = now();

  -- Rival stats
  INSERT INTO public.rival_stats (user_id, rating, wins, losses, battles_day)
  SELECT p_to, rating, wins, losses, battles_day FROM public.rival_stats WHERE user_id = p_from
  ON CONFLICT (user_id) DO UPDATE
    SET rating = GREATEST(public.rival_stats.rating, EXCLUDED.rating),
        wins = GREATEST(public.rival_stats.wins, EXCLUDED.wins),
        losses = GREATEST(public.rival_stats.losses, EXCLUDED.losses),
        updated_at = now();

  -- Forge fragments + weapons
  INSERT INTO public.duel_forge (user_id, fragments, equipped_weapon)
  SELECT p_to, fragments, equipped_weapon FROM public.duel_forge WHERE user_id = p_from
  ON CONFLICT (user_id) DO UPDATE
    SET fragments = GREATEST(public.duel_forge.fragments, EXCLUDED.fragments), updated_at = now();

  INSERT INTO public.duel_weapons (user_id, weapon_id)
  SELECT p_to, weapon_id FROM public.duel_weapons WHERE user_id = p_from
  ON CONFLICT DO NOTHING;

  -- Profile aggregates: keep the best of both
  UPDATE public.profiles dst SET
    souls = GREATEST(COALESCE(dst.souls,0), COALESCE(src.souls,0)),
    total_souls_earned = GREATEST(COALESCE(dst.total_souls_earned,0), COALESCE(src.total_souls_earned,0)),
    packs_opened = GREATEST(COALESCE(dst.packs_opened,0), COALESCE(src.packs_opened,0)),
    drafts_played = GREATEST(COALESCE(dst.drafts_played,0), COALESCE(src.drafts_played,0)),
    best_draft_score = GREATEST(COALESCE(dst.best_draft_score,0), COALESCE(src.best_draft_score,0)),
    highest_rival_rating = GREATEST(COALESCE(dst.highest_rival_rating,0), COALESCE(src.highest_rival_rating,0)),
    play_seconds = GREATEST(COALESCE(dst.play_seconds,0), COALESCE(src.play_seconds,0)),
    updated_at = now()
  FROM public.profiles src
  WHERE dst.user_id = p_to AND src.user_id = p_from;
END; $$;

REVOKE ALL ON FUNCTION public.transfer_progress_internal(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_log(uuid, text, uuid, jsonb) FROM PUBLIC, anon, authenticated;

-- One-off restoration: lil_17x -> lilgirl_17x
SELECT public.transfer_progress_internal(
  '5ca6ba8f-0eea-43ca-825c-ad2d036b4e48'::uuid,
  'f2c9d883-04e0-40d3-9600-96683db20bb0'::uuid
);
INSERT INTO public.admin_audit_log (admin_id, action, target_user_id, details)
VALUES ('c2f01eb9-8b22-4641-afcc-0e2e087da050', 'transfer_progress',
        'f2c9d883-04e0-40d3-9600-96683db20bb0',
        jsonb_build_object('from', '5ca6ba8f-0eea-43ca-825c-ad2d036b4e48', 'note', 'migration restore lil_17x -> lilgirl_17x'));