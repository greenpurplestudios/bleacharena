
-- =========================================================
-- PROGRESSION FOUNDATION
-- =========================================================

-- Extend profiles with progression + profile card fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_character_id text,
  ADD COLUMN IF NOT EXISTS favorite_character_id text,
  ADD COLUMN IF NOT EXISTS profile_frame text,
  ADD COLUMN IF NOT EXISTS profile_border text,
  ADD COLUMN IF NOT EXISTS total_souls_earned integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS packs_opened integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS drafts_played integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS best_draft_score numeric(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS highest_rival_rating integer NOT NULL DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS play_seconds integer NOT NULL DEFAULT 0;

-- Extend store_items so we can add non-purchasable cosmetics awarded by leveling
ALTER TABLE public.store_items
  ADD COLUMN IF NOT EXISTS purchasable boolean NOT NULL DEFAULT true;

-- Allow new cosmetic kinds (frame, border) on store_items
ALTER TABLE public.store_items DROP CONSTRAINT IF EXISTS store_items_kind_check;
ALTER TABLE public.store_items ADD CONSTRAINT store_items_kind_check
  CHECK (kind IN ('title','username_color','pack','frame','border'));

-- ---------- player_levels ----------
CREATE TABLE IF NOT EXISTS public.player_levels (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  level integer NOT NULL DEFAULT 1,
  xp integer NOT NULL DEFAULT 0,           -- xp toward next level
  total_xp integer NOT NULL DEFAULT 0,     -- lifetime xp
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.player_levels TO authenticated;
GRANT ALL ON public.player_levels TO service_role;
ALTER TABLE public.player_levels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own player_levels readable" ON public.player_levels;
CREATE POLICY "own player_levels readable" ON public.player_levels FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "player_levels readable to auth" ON public.player_levels;
CREATE POLICY "player_levels readable to auth" ON public.player_levels FOR SELECT TO authenticated USING (true);

-- ---------- level_rewards_config ----------
CREATE TABLE IF NOT EXISTS public.level_rewards_config (
  level integer PRIMARY KEY,
  souls integer NOT NULL DEFAULT 0,
  title_item text,
  color_item text,
  frame_item text,
  border_item text,
  badge_item text,
  name_en text NOT NULL,
  name_ar text NOT NULL
);
GRANT SELECT ON public.level_rewards_config TO authenticated;
GRANT ALL ON public.level_rewards_config TO service_role;
ALTER TABLE public.level_rewards_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "level rewards config readable" ON public.level_rewards_config;
CREATE POLICY "level rewards config readable" ON public.level_rewards_config FOR SELECT TO authenticated USING (true);

-- ---------- level_rewards_claimed ----------
CREATE TABLE IF NOT EXISTS public.level_rewards_claimed (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level integer NOT NULL,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, level)
);
GRANT SELECT ON public.level_rewards_claimed TO authenticated;
GRANT ALL ON public.level_rewards_claimed TO service_role;
ALTER TABLE public.level_rewards_claimed ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own level claims readable" ON public.level_rewards_claimed;
CREATE POLICY "own level claims readable" ON public.level_rewards_claimed FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ---------- daily_login ----------
CREATE TABLE IF NOT EXISTS public.daily_login (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  streak integer NOT NULL DEFAULT 0,
  last_claim_day text,
  total_claims integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.daily_login TO authenticated;
GRANT ALL ON public.daily_login TO service_role;
ALTER TABLE public.daily_login ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own daily_login readable" ON public.daily_login;
CREATE POLICY "own daily_login readable" ON public.daily_login FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ---------- achievements_catalog ----------
CREATE TABLE IF NOT EXISTS public.achievements_catalog (
  id text PRIMARY KEY,
  category text NOT NULL,
  rarity text NOT NULL DEFAULT 'common', -- common|rare|epic|legendary|mythic
  target integer NOT NULL DEFAULT 1,
  xp_reward integer NOT NULL DEFAULT 50,
  soul_reward integer NOT NULL DEFAULT 0,
  title_reward text,
  sort_order integer NOT NULL DEFAULT 0,
  name_en text NOT NULL,
  name_ar text NOT NULL,
  desc_en text NOT NULL DEFAULT '',
  desc_ar text NOT NULL DEFAULT ''
);
GRANT SELECT ON public.achievements_catalog TO authenticated;
GRANT ALL ON public.achievements_catalog TO service_role;
ALTER TABLE public.achievements_catalog ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "achievements catalog readable" ON public.achievements_catalog;
CREATE POLICY "achievements catalog readable" ON public.achievements_catalog FOR SELECT TO authenticated USING (true);

-- ---------- user_achievements ----------
CREATE TABLE IF NOT EXISTS public.user_achievements (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id text NOT NULL REFERENCES public.achievements_catalog(id) ON DELETE CASCADE,
  progress integer NOT NULL DEFAULT 0,
  unlocked_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, achievement_id)
);
GRANT SELECT ON public.user_achievements TO authenticated;
GRANT ALL ON public.user_achievements TO service_role;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own achievements readable" ON public.user_achievements;
CREATE POLICY "own achievements readable" ON public.user_achievements FOR SELECT TO authenticated USING (user_id = auth.uid());

-- =========================================================
-- FUNCTIONS
-- =========================================================

CREATE OR REPLACE FUNCTION public.xp_for_level(p_level integer)
RETURNS integer LANGUAGE sql IMMUTABLE AS $$
  SELECT (50 * GREATEST(1,p_level) * (GREATEST(1,p_level) + 1))::integer;
$$;

-- Grant a store item to a user's inventory idempotently
CREATE OR REPLACE FUNCTION public.grant_item(p_user uuid, p_item_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_item_id IS NULL THEN RETURN; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.store_items WHERE id = p_item_id) THEN RETURN; END IF;
  INSERT INTO public.user_inventory (user_id, item_id) VALUES (p_user, p_item_id)
  ON CONFLICT DO NOTHING;
END;
$$;

-- Add XP; loop level-ups, return summary + any unlocked milestone levels
CREATE OR REPLACE FUNCTION public.add_xp(p_amount integer, p_source text DEFAULT 'generic')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_row public.player_levels%ROWTYPE;
  v_need integer;
  v_leveled boolean := false;
  v_prev_level integer;
  v_unlocks jsonb := '[]'::jsonb;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    SELECT * INTO v_row FROM public.player_levels WHERE user_id = v_user;
    IF v_row.user_id IS NULL THEN
      RETURN jsonb_build_object('ok', true, 'level', 1, 'xp', 0, 'xp_to_next', public.xp_for_level(1), 'leveled_up', false, 'unlocks', v_unlocks);
    END IF;
    RETURN jsonb_build_object('ok', true, 'level', v_row.level, 'xp', v_row.xp, 'xp_to_next', public.xp_for_level(v_row.level), 'leveled_up', false, 'unlocks', v_unlocks);
  END IF;

  INSERT INTO public.player_levels (user_id, level, xp, total_xp)
  VALUES (v_user, 1, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_row FROM public.player_levels WHERE user_id = v_user FOR UPDATE;
  v_prev_level := v_row.level;
  v_row.xp := v_row.xp + p_amount;
  v_row.total_xp := v_row.total_xp + p_amount;

  LOOP
    v_need := public.xp_for_level(v_row.level);
    EXIT WHEN v_row.xp < v_need;
    v_row.xp := v_row.xp - v_need;
    v_row.level := v_row.level + 1;
    v_leveled := true;
    IF EXISTS (SELECT 1 FROM public.level_rewards_config WHERE level = v_row.level) THEN
      v_unlocks := v_unlocks || jsonb_build_array(v_row.level);
    END IF;
  END LOOP;

  UPDATE public.player_levels
    SET level = v_row.level, xp = v_row.xp, total_xp = v_row.total_xp, updated_at = now()
    WHERE user_id = v_user;

  RETURN jsonb_build_object(
    'ok', true, 'level', v_row.level, 'xp', v_row.xp,
    'xp_to_next', public.xp_for_level(v_row.level),
    'leveled_up', v_leveled, 'prev_level', v_prev_level, 'unlocks', v_unlocks
  );
END;
$$;

-- Claim a level milestone reward (souls + cosmetic grants)
CREATE OR REPLACE FUNCTION public.claim_level_reward(p_level integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_cur integer;
  v_cfg public.level_rewards_config%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  SELECT level INTO v_cur FROM public.player_levels WHERE user_id = v_user;
  IF COALESCE(v_cur, 1) < p_level THEN
    RETURN jsonb_build_object('ok', false, 'error', 'level_locked');
  END IF;
  SELECT * INTO v_cfg FROM public.level_rewards_config WHERE level = p_level;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'no_reward'); END IF;
  IF EXISTS (SELECT 1 FROM public.level_rewards_claimed WHERE user_id = v_user AND level = p_level) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_claimed');
  END IF;

  IF v_cfg.souls > 0 THEN
    UPDATE public.profiles SET souls = COALESCE(souls,0) + v_cfg.souls,
                                total_souls_earned = COALESCE(total_souls_earned,0) + v_cfg.souls,
                                updated_at = now()
    WHERE user_id = v_user;
  END IF;
  PERFORM public.grant_item(v_user, v_cfg.title_item);
  PERFORM public.grant_item(v_user, v_cfg.color_item);
  PERFORM public.grant_item(v_user, v_cfg.frame_item);
  PERFORM public.grant_item(v_user, v_cfg.border_item);
  PERFORM public.grant_item(v_user, v_cfg.badge_item);

  INSERT INTO public.level_rewards_claimed (user_id, level) VALUES (v_user, p_level);

  RETURN jsonb_build_object('ok', true, 'level', p_level, 'souls', v_cfg.souls,
    'title_item', v_cfg.title_item, 'color_item', v_cfg.color_item,
    'frame_item', v_cfg.frame_item, 'border_item', v_cfg.border_item, 'badge_item', v_cfg.badge_item);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_level_rewards_state()
RETURNS TABLE(level integer, souls integer, title_item text, color_item text,
              frame_item text, border_item text, badge_item text,
              name_en text, name_ar text, claimed boolean, unlocked boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.level, c.souls, c.title_item, c.color_item, c.frame_item, c.border_item, c.badge_item,
         c.name_en, c.name_ar,
         EXISTS(SELECT 1 FROM public.level_rewards_claimed cl WHERE cl.user_id = auth.uid() AND cl.level = c.level),
         c.level <= COALESCE((SELECT level FROM public.player_levels WHERE user_id = auth.uid()), 1)
  FROM public.level_rewards_config c
  ORDER BY c.level;
$$;

-- Daily login: read state
CREATE OR REPLACE FUNCTION public.get_daily_login_state()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_row public.daily_login%ROWTYPE;
  v_today text := public.current_day_key();
  v_can_claim boolean;
  v_next_index integer;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  SELECT * INTO v_row FROM public.daily_login WHERE user_id = v_user;
  IF v_row.user_id IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'streak', 0, 'last_claim_day', null,
      'can_claim', true, 'next_day', 1, 'total_claims', 0);
  END IF;
  v_can_claim := v_row.last_claim_day IS DISTINCT FROM v_today;
  v_next_index := CASE
    WHEN v_row.last_claim_day IS NULL THEN 1
    WHEN v_row.last_claim_day = v_today THEN ((v_row.streak - 1) % 7) + 1
    WHEN v_row.last_claim_day = to_char((v_today::date) - 1, 'YYYY-MM-DD') THEN (v_row.streak % 7) + 1
    ELSE 1
  END;
  RETURN jsonb_build_object('ok', true, 'streak', v_row.streak,
    'last_claim_day', v_row.last_claim_day, 'can_claim', v_can_claim,
    'next_day', v_next_index, 'total_claims', v_row.total_claims);
END;
$$;

-- Daily login: claim reward (souls or pack based on day)
CREATE OR REPLACE FUNCTION public.claim_daily_login()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_row public.daily_login%ROWTYPE;
  v_today text := public.current_day_key();
  v_yesterday text := to_char((v_today::date) - 1, 'YYYY-MM-DD');
  v_new_streak integer;
  v_day_index integer;
  v_souls integer := 0;
  v_pack text := NULL;
  v_xp integer := 20;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;

  INSERT INTO public.daily_login (user_id, streak, last_claim_day, total_claims)
  VALUES (v_user, 0, NULL, 0)
  ON CONFLICT (user_id) DO NOTHING;
  SELECT * INTO v_row FROM public.daily_login WHERE user_id = v_user FOR UPDATE;

  IF v_row.last_claim_day = v_today THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_claimed_today');
  END IF;

  IF v_row.last_claim_day = v_yesterday THEN
    v_new_streak := v_row.streak + 1;
  ELSE
    v_new_streak := 1;
  END IF;
  v_day_index := ((v_new_streak - 1) % 7) + 1;

  -- 7-day cycle
  IF v_day_index = 1 THEN v_souls := 100;
  ELSIF v_day_index = 2 THEN v_pack := 'bronze';
  ELSIF v_day_index = 3 THEN v_souls := 200;
  ELSIF v_day_index = 4 THEN v_pack := 'silver';
  ELSIF v_day_index = 5 THEN v_souls := 300;
  ELSIF v_day_index = 6 THEN v_pack := 'gold';
  ELSIF v_day_index = 7 THEN v_pack := 'legend'; v_souls := 500;
  END IF;

  IF v_souls > 0 THEN
    UPDATE public.profiles SET souls = COALESCE(souls,0) + v_souls,
                                total_souls_earned = COALESCE(total_souls_earned,0) + v_souls,
                                updated_at = now()
      WHERE user_id = v_user;
  END IF;
  IF v_pack IS NOT NULL THEN
    INSERT INTO public.user_packs (user_id, tier, count) VALUES (v_user, v_pack, 1)
    ON CONFLICT (user_id, tier) DO UPDATE SET count = public.user_packs.count + 1;
  END IF;

  UPDATE public.daily_login SET streak = v_new_streak, last_claim_day = v_today,
    total_claims = total_claims + 1, updated_at = now()
    WHERE user_id = v_user;

  PERFORM public.add_xp(v_xp, 'daily_login');

  RETURN jsonb_build_object('ok', true, 'streak', v_new_streak, 'day_index', v_day_index,
    'souls', v_souls, 'pack', v_pack, 'xp', v_xp);
END;
$$;

-- Achievements: track progress; unlock rewards when target met
CREATE OR REPLACE FUNCTION public.track_achievement(p_id text, p_progress integer DEFAULT 1, p_absolute boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_def public.achievements_catalog%ROWTYPE;
  v_row public.user_achievements%ROWTYPE;
  v_new_prog integer;
  v_unlocked boolean := false;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  SELECT * INTO v_def FROM public.achievements_catalog WHERE id = p_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_achievement'); END IF;

  INSERT INTO public.user_achievements (user_id, achievement_id, progress)
    VALUES (v_user, p_id, 0)
    ON CONFLICT DO NOTHING;
  SELECT * INTO v_row FROM public.user_achievements
    WHERE user_id = v_user AND achievement_id = p_id FOR UPDATE;

  IF v_row.unlocked_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'already_unlocked', true, 'progress', v_row.progress, 'target', v_def.target);
  END IF;

  IF p_absolute THEN
    v_new_prog := GREATEST(v_row.progress, p_progress);
  ELSE
    v_new_prog := v_row.progress + GREATEST(0, p_progress);
  END IF;
  v_new_prog := LEAST(v_new_prog, v_def.target);

  IF v_new_prog >= v_def.target THEN
    v_unlocked := true;
    UPDATE public.user_achievements SET progress = v_new_prog, unlocked_at = now(), updated_at = now()
      WHERE user_id = v_user AND achievement_id = p_id;
    IF v_def.soul_reward > 0 THEN
      UPDATE public.profiles SET souls = COALESCE(souls,0) + v_def.soul_reward,
        total_souls_earned = COALESCE(total_souls_earned,0) + v_def.soul_reward,
        updated_at = now() WHERE user_id = v_user;
    END IF;
    PERFORM public.grant_item(v_user, v_def.title_reward);
    IF v_def.xp_reward > 0 THEN PERFORM public.add_xp(v_def.xp_reward, 'achievement'); END IF;
  ELSE
    UPDATE public.user_achievements SET progress = v_new_prog, updated_at = now()
      WHERE user_id = v_user AND achievement_id = p_id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'progress', v_new_prog, 'target', v_def.target,
    'unlocked', v_unlocked, 'achievement', jsonb_build_object(
      'id', v_def.id, 'name_en', v_def.name_en, 'name_ar', v_def.name_ar,
      'rarity', v_def.rarity, 'xp_reward', v_def.xp_reward, 'soul_reward', v_def.soul_reward));
END;
$$;

-- Profile avatar / favorite: validate ownership
CREATE OR REPLACE FUNCTION public.set_avatar(p_character_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  IF p_character_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.user_collection WHERE user_id = v_user AND character_id = p_character_id
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_owned');
  END IF;
  UPDATE public.profiles SET avatar_character_id = p_character_id, updated_at = now()
    WHERE user_id = v_user;
  RETURN jsonb_build_object('ok', true, 'avatar_character_id', p_character_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.set_favorite(p_character_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  IF p_character_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.user_collection WHERE user_id = v_user AND character_id = p_character_id
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_owned');
  END IF;
  UPDATE public.profiles SET favorite_character_id = p_character_id, updated_at = now()
    WHERE user_id = v_user;
  RETURN jsonb_build_object('ok', true, 'favorite_character_id', p_character_id);
END;
$$;

-- Achievements listing
CREATE OR REPLACE FUNCTION public.get_my_achievements()
RETURNS TABLE(id text, category text, rarity text, target integer,
              xp_reward integer, soul_reward integer, title_reward text,
              name_en text, name_ar text, desc_en text, desc_ar text,
              sort_order integer, progress integer, unlocked_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.category, c.rarity, c.target, c.xp_reward, c.soul_reward, c.title_reward,
    c.name_en, c.name_ar, c.desc_en, c.desc_ar, c.sort_order,
    COALESCE(ua.progress, 0), ua.unlocked_at
  FROM public.achievements_catalog c
  LEFT JOIN public.user_achievements ua ON ua.achievement_id = c.id AND ua.user_id = auth.uid()
  ORDER BY c.category, c.sort_order, c.id;
$$;

-- Own full profile
CREATE OR REPLACE FUNCTION public.get_my_profile_full()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_p public.profiles%ROWTYPE;
  v_lvl public.player_levels%ROWTYPE;
  v_coll integer;
  v_catalog integer;
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
END;
$$;

-- Public profile (safe fields only)
CREATE OR REPLACE FUNCTION public.get_public_profile(p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
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
    'created_at', v_p.created_at,
    'best_draft_score', v_p.best_draft_score, 'highest_rival_rating', v_p.highest_rival_rating,
    'packs_opened', v_p.packs_opened, 'drafts_played', v_p.drafts_played,
    'total_souls_earned', v_p.total_souls_earned,
    'level', COALESCE(v_lvl.level, 1), 'xp', COALESCE(v_lvl.xp, 0),
    'xp_to_next', public.xp_for_level(COALESCE(v_lvl.level, 1)),
    'collection_owned', v_coll, 'collection_total', v_catalog,
    'rival_rating', COALESCE(v_rival.rating, 1000),
    'rival_wins', COALESCE(v_rival.wins, 0), 'rival_losses', COALESCE(v_rival.losses, 0),
    'bleachdle_best_streak', COALESCE(v_bd.best_streak, 0),
    'recent_achievements', v_recent
  );
END;
$$;

-- Extend equip_item to accept frame/border kinds
CREATE OR REPLACE FUNCTION public.equip_item(p_kind text, p_item_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_item public.store_items%ROWTYPE;
  v_owned boolean;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  IF p_kind NOT IN ('title','username_color','frame','border') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_kind');
  END IF;

  IF p_item_id IS NULL THEN
    IF p_kind = 'title' THEN
      UPDATE public.profiles SET title = NULL, updated_at = now() WHERE user_id = v_user;
    ELSIF p_kind = 'username_color' THEN
      UPDATE public.profiles SET username_color = NULL, updated_at = now() WHERE user_id = v_user;
    ELSIF p_kind = 'frame' THEN
      UPDATE public.profiles SET profile_frame = NULL, updated_at = now() WHERE user_id = v_user;
    ELSIF p_kind = 'border' THEN
      UPDATE public.profiles SET profile_border = NULL, updated_at = now() WHERE user_id = v_user;
    END IF;
    RETURN jsonb_build_object('ok', true, 'unequipped', true);
  END IF;

  SELECT * INTO v_item FROM public.store_items WHERE id = p_item_id AND kind = p_kind;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'not_found'); END IF;

  SELECT true INTO v_owned FROM public.user_inventory WHERE user_id = v_user AND item_id = v_item.id;
  IF NOT COALESCE(v_owned, false) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_owned');
  END IF;

  IF p_kind = 'title' THEN
    UPDATE public.profiles SET title = v_item.id, updated_at = now() WHERE user_id = v_user;
  ELSIF p_kind = 'username_color' THEN
    UPDATE public.profiles SET username_color = (v_item.meta->>'hex'), updated_at = now() WHERE user_id = v_user;
  ELSIF p_kind = 'frame' THEN
    UPDATE public.profiles SET profile_frame = v_item.id, updated_at = now() WHERE user_id = v_user;
  ELSIF p_kind = 'border' THEN
    UPDATE public.profiles SET profile_border = v_item.id, updated_at = now() WHERE user_id = v_user;
  END IF;

  RETURN jsonb_build_object('ok', true, 'item_id', v_item.id);
END;
$$;

-- Update get_store to hide non-purchasable items
CREATE OR REPLACE FUNCTION public.get_store()
RETURNS TABLE(id text, kind text, name_en text, name_ar text, cost integer, meta jsonb, sort_order integer, owned boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.id, s.kind, s.name_en, s.name_ar, s.cost, s.meta, s.sort_order,
    CASE WHEN s.kind = 'pack' THEN false
         ELSE EXISTS (SELECT 1 FROM public.user_inventory ui WHERE ui.user_id = auth.uid() AND ui.item_id = s.id)
    END AS owned
  FROM public.store_items s
  WHERE s.active AND s.purchasable
  ORDER BY s.kind, s.sort_order, s.cost;
$$;

-- =========================================================
-- SEEDS: cosmetic items granted by leveling (non-purchasable)
-- =========================================================
INSERT INTO public.store_items (id, kind, name_en, name_ar, cost, meta, active, purchasable, sort_order) VALUES
  ('color_bronze', 'username_color', 'Bronze Color', 'لون برونزي', 0, '{"hex":"#cd7f32"}', true, false, 900),
  ('color_silver', 'username_color', 'Silver Color', 'لون فضي', 0, '{"hex":"#c0c0c0"}', true, false, 901),
  ('color_gold',   'username_color', 'Gold Color',   'لون ذهبي',   0, '{"hex":"#ffd700"}', true, false, 902),
  ('color_rainbow','username_color', 'Rainbow Color','لون قوس قزح', 0, '{"hex":"rainbow"}', true, false, 903),
  ('title_experienced', 'title', 'Experienced Soul Reaper', 'شينيغامي متمرس', 0, '{}', true, false, 910),
  ('title_elite_captain', 'title', 'Elite Captain', 'كابتن النخبة', 0, '{}', true, false, 911),
  ('title_legend', 'title', 'Legend of the Soul Society', 'أسطورة مجتمع الأرواح', 0, '{}', true, false, 912),
  ('title_transcendent', 'title', 'Transcendent', 'المتسامي', 0, '{}', true, false, 913),
  ('title_soul_king', 'title', 'The Soul King', 'ملك الأرواح', 0, '{}', true, false, 914),
  ('frame_bronze', 'frame', 'Bronze Frame', 'إطار برونزي', 0, '{"tier":"bronze"}', true, false, 920),
  ('frame_silver', 'frame', 'Animated Silver Frame', 'إطار فضي متحرك', 0, '{"tier":"silver","animated":true}', true, false, 921),
  ('frame_gold',   'frame', 'Animated Gold Frame', 'إطار ذهبي متحرك', 0, '{"tier":"gold","animated":true}', true, false, 922),
  ('frame_mythic', 'frame', 'Mythic Frame', 'إطار أسطوري', 0, '{"tier":"mythic","animated":true}', true, false, 923),
  ('border_exclusive', 'border', 'Exclusive Profile Border', 'حد ملف حصري', 0, '{"tier":"exclusive"}', true, false, 930),
  ('border_animated', 'border', 'Animated Profile Border', 'حد ملف متحرك', 0, '{"animated":true}', true, false, 931),
  ('badge_legendary_level', 'title', 'Legendary Level Badge', 'شارة أسطورية', 0, '{"badge":true}', true, false, 940)
ON CONFLICT (id) DO NOTHING;

-- Ensure existing store items remain purchasable
UPDATE public.store_items SET purchasable = true WHERE purchasable IS NULL;

-- =========================================================
-- SEEDS: level_rewards_config
-- =========================================================
INSERT INTO public.level_rewards_config (level, souls, title_item, color_item, frame_item, border_item, badge_item, name_en, name_ar) VALUES
  (5,   200,  NULL, NULL, NULL, NULL, NULL, 'First Steps', 'الخطوات الأولى'),
  (10,  0,    NULL, NULL, NULL, 'border_exclusive', NULL, 'Exclusive Profile Border', 'حد ملف حصري'),
  (15,  0,    NULL, 'color_bronze', NULL, NULL, NULL, 'Bronze Username Color', 'لون اسم برونزي'),
  (20,  0,    NULL, NULL, 'frame_bronze', NULL, NULL, 'Bronze Profile Frame', 'إطار برونزي'),
  (30,  0,    NULL, 'color_silver', NULL, NULL, NULL, 'Silver Username Color', 'لون اسم فضي'),
  (40,  0,    'title_experienced', NULL, NULL, NULL, NULL, 'Experienced Soul Reaper', 'شينيغامي متمرس'),
  (50,  0,    NULL, NULL, 'frame_silver', NULL, NULL, 'Animated Silver Frame', 'إطار فضي متحرك'),
  (60,  0,    NULL, 'color_gold', NULL, NULL, NULL, 'Gold Username Color', 'لون اسم ذهبي'),
  (75,  0,    'title_elite_captain', NULL, NULL, NULL, NULL, 'Elite Captain', 'كابتن النخبة'),
  (100, 2000, 'title_legend', NULL, 'frame_gold', NULL, 'badge_legendary_level', 'Legend of the Soul Society', 'أسطورة مجتمع الأرواح'),
  (150, 0,    'title_transcendent', 'color_rainbow', NULL, 'border_animated', NULL, 'Transcendent', 'المتسامي'),
  (200, 5000, 'title_soul_king', NULL, 'frame_mythic', NULL, NULL, 'The Soul King', 'ملك الأرواح')
ON CONFLICT (level) DO NOTHING;

-- =========================================================
-- SEEDS: achievements_catalog
-- =========================================================
INSERT INTO public.achievements_catalog (id, category, rarity, target, xp_reward, soul_reward, title_reward, sort_order, name_en, name_ar, desc_en, desc_ar) VALUES
  -- Draft
  ('draft_first', 'draft', 'common', 1, 50, 25, NULL, 1, 'First Draft', 'أول درافت', 'Complete your first draft.', 'أكمل أول درافت.'),
  ('draft_90', 'draft', 'rare', 1, 150, 100, NULL, 2, 'Score 90+', 'نتيجة ٩٠+', 'Finish a draft with 90 or higher.', 'أنهِ درافت بـ٩٠ أو أكثر.'),
  ('draft_95', 'draft', 'epic', 1, 300, 250, NULL, 3, 'Score 95+', 'نتيجة ٩٥+', 'Finish a draft with 95 or higher.', 'أنهِ درافت بـ٩٥ أو أكثر.'),
  ('draft_perfect', 'draft', 'legendary', 1, 1000, 1000, NULL, 4, 'Perfect Draft', 'درافت مثالي', 'Finish a draft with 100.', 'أنهِ درافت بـ١٠٠.'),
  ('draft_100', 'draft', 'rare', 100, 500, 300, NULL, 5, '100 Drafts', '١٠٠ درافت', 'Complete 100 drafts.', 'أكمل ١٠٠ درافت.'),
  ('draft_500', 'draft', 'legendary', 500, 2000, 2000, NULL, 6, '500 Drafts', '٥٠٠ درافت', 'Complete 500 drafts.', 'أكمل ٥٠٠ درافت.'),
  -- Collection
  ('col_10', 'collection', 'common', 10, 100, 50, NULL, 1, 'Collect 10 Characters', 'اجمع ١٠ شخصيات', '', ''),
  ('col_25', 'collection', 'rare', 25, 250, 150, NULL, 2, 'Collect 25 Characters', 'اجمع ٢٥ شخصية', '', ''),
  ('col_50', 'collection', 'epic', 50, 500, 300, NULL, 3, 'Collect 50 Characters', 'اجمع ٥٠ شخصية', '', ''),
  ('col_all_legendary', 'collection', 'epic', 1, 750, 500, NULL, 4, 'Every Legendary', 'كل الأسطوريين', 'Collect every Legendary character.', 'اجمع كل الأسطوريين.'),
  ('col_all_mythic', 'collection', 'legendary', 1, 1500, 1000, NULL, 5, 'Every Mythic', 'كل الأسطوريين الخارقين', 'Collect every Mythic character.', ''),
  ('col_complete', 'collection', 'mythic', 1, 3000, 3000, NULL, 6, 'Complete the Collection', 'أكمل المجموعة', '', ''),
  -- Packs
  ('pack_10', 'packs', 'common', 10, 100, 50, NULL, 1, 'Open 10 Packs', 'افتح ١٠ حزم', '', ''),
  ('pack_100', 'packs', 'rare', 100, 300, 200, NULL, 2, 'Open 100 Packs', 'افتح ١٠٠ حزمة', '', ''),
  ('pack_500', 'packs', 'legendary', 500, 1500, 1500, NULL, 3, 'Open 500 Packs', 'افتح ٥٠٠ حزمة', '', ''),
  ('pack_first_mythic', 'packs', 'epic', 1, 500, 300, NULL, 4, 'First Mythic', 'أول أسطوري خارق', 'Pull your first Mythic.', ''),
  ('pack_25_mythic', 'packs', 'legendary', 25, 2000, 2000, NULL, 5, '25 Mythics', '٢٥ أسطوري خارق', '', ''),
  -- Rivals
  ('rival_first', 'rivals', 'common', 1, 50, 25, NULL, 1, 'First Victory', 'أول انتصار', '', ''),
  ('rival_10', 'rivals', 'common', 10, 150, 100, NULL, 2, '10 Wins', '١٠ انتصارات', '', ''),
  ('rival_100', 'rivals', 'rare', 100, 500, 300, NULL, 3, '100 Wins', '١٠٠ انتصار', '', ''),
  ('rival_500', 'rivals', 'legendary', 500, 2000, 2000, NULL, 4, '500 Wins', '٥٠٠ انتصار', '', ''),
  ('rival_lieutenant', 'rivals', 'rare', 1, 200, 150, NULL, 5, 'Reach Lieutenant (1100)', 'ملازم', '', ''),
  ('rival_captain', 'rivals', 'epic', 1, 500, 400, NULL, 6, 'Reach Captain (1300)', 'كابتن', '', ''),
  ('rival_royal_guard', 'rivals', 'legendary', 1, 1000, 800, NULL, 7, 'Reach Royal Guard (1500)', 'الحرس الملكي', '', ''),
  ('rival_soul_king', 'rivals', 'mythic', 1, 3000, 3000, NULL, 8, 'Reach Soul King (1800)', 'ملك الأرواح', '', ''),
  -- Bleachdle
  ('bd_first', 'bleachdle', 'common', 1, 50, 25, NULL, 1, 'First Solve', 'أول حل', '', ''),
  ('bd_streak_7', 'bleachdle', 'rare', 7, 300, 200, NULL, 2, '7-Day Streak', 'سلسلة ٧ أيام', '', ''),
  ('bd_streak_30', 'bleachdle', 'legendary', 30, 1500, 1500, NULL, 3, '30-Day Streak', 'سلسلة ٣٠ يوم', '', ''),
  ('bd_100', 'bleachdle', 'epic', 100, 500, 400, NULL, 4, 'Play 100 Games', 'العب ١٠٠ لعبة', '', ''),
  -- Economy
  ('econ_earn_10k', 'economy', 'rare', 10000, 300, 0, NULL, 1, 'Earn 10,000 Souls', 'اكسب ١٠٬٠٠٠ روح', '', ''),
  ('econ_spend_10k', 'economy', 'rare', 10000, 300, 0, NULL, 2, 'Spend 10,000 Souls', 'أنفق ١٠٬٠٠٠ روح', '', ''),
  ('econ_first_cosmetic', 'economy', 'common', 1, 100, 50, NULL, 3, 'First Cosmetic', 'أول تجميلي', '', ''),
  -- General
  ('gen_level_25', 'general', 'rare', 25, 300, 200, NULL, 1, 'Reach Level 25', 'المستوى ٢٥', '', ''),
  ('gen_level_50', 'general', 'epic', 50, 750, 500, NULL, 2, 'Reach Level 50', 'المستوى ٥٠', '', ''),
  ('gen_level_100', 'general', 'legendary', 100, 2000, 2000, NULL, 3, 'Reach Level 100', 'المستوى ١٠٠', '', ''),
  ('gen_login_30', 'general', 'epic', 30, 750, 500, NULL, 4, 'Login 30 Days', 'دخول ٣٠ يوم', '', '')
ON CONFLICT (id) DO NOTHING;
