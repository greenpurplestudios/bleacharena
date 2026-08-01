-- ============ SCHEMA ============
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name_frame text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code text;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_referral_code_key ON public.profiles (referral_code) WHERE referral_code IS NOT NULL;
ALTER TABLE public.level_rewards_config ADD COLUMN IF NOT EXISTS name_frame_item text;

ALTER TABLE public.store_items DROP CONSTRAINT IF EXISTS store_items_kind_check;
ALTER TABLE public.store_items ADD CONSTRAINT store_items_kind_check
  CHECK (kind = ANY (ARRAY['title','username_color','pack','frame','border','name_frame','potion']));

CREATE TABLE IF NOT EXISTS public.user_potions (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id text NOT NULL REFERENCES public.store_items(id),
  count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_id)
);
GRANT SELECT ON public.user_potions TO authenticated;
GRANT ALL ON public.user_potions TO service_role;
ALTER TABLE public.user_potions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own potions" ON public.user_potions FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.active_potions (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id text NOT NULL REFERENCES public.store_items(id),
  luck numeric(4,2) NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.active_potions TO authenticated;
GRANT ALL ON public.active_potions TO service_role;
ALTER TABLE public.active_potions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own active potion" ON public.active_potions FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL,
  souls_awarded integer NOT NULL DEFAULT 0,
  packs_awarded integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "see own referrals" ON public.referrals FOR SELECT TO authenticated
  USING (referrer_id = auth.uid() OR referred_id = auth.uid());

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;
DROP TRIGGER IF EXISTS update_user_potions_updated_at ON public.user_potions;
CREATE TRIGGER update_user_potions_updated_at BEFORE UPDATE ON public.user_potions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_active_potions_updated_at ON public.active_potions;
CREATE TRIGGER update_active_potions_updated_at BEFORE UPDATE ON public.active_potions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ CATALOG ============
INSERT INTO public.store_items (id, kind, name_en, name_ar, cost, meta, active, sort_order, purchasable) VALUES
  ('nf_ash','name_frame','Ash Ember','جمر الرماد',2500,'{"style":"ash","animated":false}',true,10,true),
  ('nf_seireitei','name_frame','Seireitei Marble','رخام السيريتي',4000,'{"style":"seireitei","animated":false}',true,20,true),
  ('nf_hollow','name_frame','Hollow Mask','قناع الهولو',7000,'{"style":"hollow","animated":true}',true,30,true),
  ('nf_quincy','name_frame','Quincy Light','ضوء الكوينسي',11000,'{"style":"quincy","animated":true}',true,40,true),
  ('nf_bankai','name_frame','Bankai Aura','هالة البانكاي',18000,'{"style":"bankai","animated":true}',true,50,true),
  ('nf_academy','name_frame','Academy Crest','شعار الأكاديمية',0,'{"style":"academy","animated":false}',true,60,false),
  ('nf_gotei','name_frame','Gotei 13 Banner','راية الغوتي ١٣',0,'{"style":"gotei","animated":true}',true,70,false),
  ('nf_zangetsu','name_frame','Zangetsu Edge','حد زانغيتسو',0,'{"style":"zangetsu","animated":true}',true,80,false),
  ('nf_soul_king','name_frame','Soul King Throne','عرش ملك الأرواح',0,'{"style":"soulking","animated":true}',true,90,false),
  ('potion_luck_25','potion','Reiatsu Tonic','منشط الرياتسو',1200,'{"luck":0.25,"minutes":5}',true,10,true),
  ('potion_luck_50','potion','Soul Elixir','إكسير الأرواح',2600,'{"luck":0.5,"minutes":5}',true,20,true),
  ('potion_luck_100','potion','Urahara''s Secret Brew','خلطة أوراهارا السرية',5200,'{"luck":1.0,"minutes":5}',true,30,true)
ON CONFLICT (id) DO UPDATE SET
  kind = EXCLUDED.kind, name_en = EXCLUDED.name_en, name_ar = EXCLUDED.name_ar,
  cost = EXCLUDED.cost, meta = EXCLUDED.meta, active = true,
  sort_order = EXCLUDED.sort_order, purchasable = EXCLUDED.purchasable;

INSERT INTO public.level_rewards_config (level, souls, name_frame_item, name_en, name_ar) VALUES
  (25, 0, 'nf_academy', 'Academy Name Frame', 'إطار اسم الأكاديمية'),
  (70, 0, 'nf_gotei', 'Gotei 13 Name Frame', 'إطار اسم الغوتي ١٣'),
  (120, 0, 'nf_zangetsu', 'Zangetsu Name Frame', 'إطار اسم زانغيتسو')
ON CONFLICT (level) DO UPDATE SET name_frame_item = EXCLUDED.name_frame_item;
UPDATE public.level_rewards_config SET name_frame_item = 'nf_soul_king' WHERE level = 200;

-- ============ FUNCTIONS ============
CREATE OR REPLACE FUNCTION public.get_store()
RETURNS TABLE(id text, kind text, name_en text, name_ar text, cost integer, meta jsonb, sort_order integer, owned boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT s.id, s.kind, s.name_en, s.name_ar, s.cost, s.meta, s.sort_order,
    CASE WHEN s.kind IN ('pack','potion') THEN false
         ELSE EXISTS (SELECT 1 FROM public.user_inventory ui WHERE ui.user_id = auth.uid() AND ui.item_id = s.id)
    END AS owned
  FROM public.store_items s
  WHERE s.active AND s.purchasable
  ORDER BY s.kind, s.sort_order, s.cost;
$$;

CREATE OR REPLACE FUNCTION public.purchase_item(p_item_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_user uuid := auth.uid();
  v_item public.store_items%ROWTYPE;
  v_souls int;
  v_owned boolean;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  SELECT * INTO v_item FROM public.store_items WHERE id = p_item_id AND active AND purchasable;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'not_found'); END IF;

  SELECT COALESCE(souls,0) INTO v_souls FROM public.profiles WHERE user_id = v_user;
  IF v_souls < v_item.cost THEN
    RETURN jsonb_build_object('ok', false, 'error', 'insufficient_souls', 'souls', v_souls, 'cost', v_item.cost);
  END IF;

  IF v_item.kind IN ('title','username_color','name_frame','frame','border') THEN
    SELECT true INTO v_owned FROM public.user_inventory WHERE user_id = v_user AND item_id = v_item.id;
    IF COALESCE(v_owned,false) THEN
      RETURN jsonb_build_object('ok', false, 'error', 'already_owned');
    END IF;
  END IF;

  UPDATE public.profiles SET souls = souls - v_item.cost, updated_at = now() WHERE user_id = v_user;

  IF v_item.kind = 'pack' THEN
    INSERT INTO public.user_packs (user_id, tier, count)
      VALUES (v_user, v_item.meta->>'tier', 1)
      ON CONFLICT (user_id, tier) DO UPDATE SET count = public.user_packs.count + 1;
  ELSIF v_item.kind = 'potion' THEN
    INSERT INTO public.user_potions (user_id, item_id, count)
      VALUES (v_user, v_item.id, 1)
      ON CONFLICT (user_id, item_id) DO UPDATE SET count = public.user_potions.count + 1, updated_at = now();
  ELSE
    INSERT INTO public.user_inventory (user_id, item_id) VALUES (v_user, v_item.id)
      ON CONFLICT DO NOTHING;
  END IF;

  RETURN jsonb_build_object('ok', true, 'item_id', v_item.id, 'kind', v_item.kind, 'cost', v_item.cost);
END; $$;

CREATE OR REPLACE FUNCTION public.equip_item(p_kind text, p_item_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_user uuid := auth.uid();
  v_item public.store_items%ROWTYPE;
  v_owned boolean;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  IF p_kind NOT IN ('title','username_color','frame','border','name_frame') THEN
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
    ELSIF p_kind = 'name_frame' THEN
      UPDATE public.profiles SET name_frame = NULL, updated_at = now() WHERE user_id = v_user;
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
  ELSIF p_kind = 'name_frame' THEN
    UPDATE public.profiles SET name_frame = v_item.id, updated_at = now() WHERE user_id = v_user;
  END IF;

  RETURN jsonb_build_object('ok', true, 'item_id', v_item.id);
END; $$;

-- Potions
CREATE OR REPLACE FUNCTION public.get_my_potions()
RETURNS TABLE(item_id text, count integer, name_en text, name_ar text, luck numeric, minutes integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT up.item_id, up.count, s.name_en, s.name_ar,
    (s.meta->>'luck')::numeric, (s.meta->>'minutes')::int
  FROM public.user_potions up
  JOIN public.store_items s ON s.id = up.item_id
  WHERE up.user_id = auth.uid() AND up.count > 0
  ORDER BY s.sort_order;
$$;

CREATE OR REPLACE FUNCTION public.get_active_potion()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_row public.active_potions%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  SELECT * INTO v_row FROM public.active_potions WHERE user_id = auth.uid() AND expires_at > now();
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', true, 'active', false, 'luck', 0); END IF;
  RETURN jsonb_build_object('ok', true, 'active', true, 'item_id', v_row.item_id,
    'luck', v_row.luck, 'expires_at', v_row.expires_at, 'now', now());
END; $$;

CREATE OR REPLACE FUNCTION public.activate_potion(p_item_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_user uuid := auth.uid();
  v_item public.store_items%ROWTYPE;
  v_count int;
  v_expires timestamptz;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  IF EXISTS (SELECT 1 FROM public.active_potions WHERE user_id = v_user AND expires_at > now()) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'potion_active');
  END IF;
  SELECT * INTO v_item FROM public.store_items WHERE id = p_item_id AND kind = 'potion' AND active;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'not_found'); END IF;

  SELECT count INTO v_count FROM public.user_potions WHERE user_id = v_user AND item_id = p_item_id FOR UPDATE;
  IF COALESCE(v_count, 0) <= 0 THEN RETURN jsonb_build_object('ok', false, 'error', 'none_owned'); END IF;

  UPDATE public.user_potions SET count = count - 1, updated_at = now()
    WHERE user_id = v_user AND item_id = p_item_id;

  v_expires := now() + make_interval(mins => COALESCE((v_item.meta->>'minutes')::int, 5));
  INSERT INTO public.active_potions (user_id, item_id, luck, expires_at)
    VALUES (v_user, p_item_id, (v_item.meta->>'luck')::numeric, v_expires)
    ON CONFLICT (user_id) DO UPDATE SET item_id = EXCLUDED.item_id, luck = EXCLUDED.luck,
      expires_at = EXCLUDED.expires_at, updated_at = now();

  RETURN jsonb_build_object('ok', true, 'item_id', p_item_id,
    'luck', (v_item.meta->>'luck')::numeric, 'expires_at', v_expires, 'now', now());
END; $$;

-- Referrals
CREATE OR REPLACE FUNCTION public.get_my_referral()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_user uuid := auth.uid();
  v_code text;
  v_total int;
  v_souls int;
  v_used boolean;
  v_created timestamptz;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  SELECT referral_code, created_at INTO v_code, v_created FROM public.profiles WHERE user_id = v_user;
  IF v_code IS NULL THEN
    LOOP
      v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = v_code);
    END LOOP;
    UPDATE public.profiles SET referral_code = v_code, updated_at = now() WHERE user_id = v_user;
  END IF;
  SELECT COUNT(*), COALESCE(SUM(souls_awarded), 0) INTO v_total, v_souls
    FROM public.referrals WHERE referrer_id = v_user;
  SELECT EXISTS (SELECT 1 FROM public.referrals WHERE referred_id = v_user) INTO v_used;
  RETURN jsonb_build_object('ok', true, 'code', v_code, 'total', v_total,
    'souls_earned', v_souls, 'already_redeemed', v_used,
    'eligible', (NOT v_used) AND v_created > now() - interval '7 days');
END; $$;

CREATE OR REPLACE FUNCTION public.redeem_referral(p_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_user uuid := auth.uid();
  v_code text := upper(trim(coalesce(p_code, '')));
  v_referrer uuid;
  v_created timestamptz;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  IF char_length(v_code) <> 8 THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_code'); END IF;
  IF EXISTS (SELECT 1 FROM public.referrals WHERE referred_id = v_user) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_redeemed');
  END IF;

  SELECT created_at INTO v_created FROM public.profiles WHERE user_id = v_user;
  IF v_created IS NULL OR v_created < now() - interval '7 days' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'account_too_old');
  END IF;

  SELECT user_id INTO v_referrer FROM public.profiles WHERE referral_code = v_code;
  IF v_referrer IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_code'); END IF;
  IF v_referrer = v_user THEN RETURN jsonb_build_object('ok', false, 'error', 'self_referral'); END IF;

  INSERT INTO public.referrals (referrer_id, referred_id, code, souls_awarded, packs_awarded)
    VALUES (v_referrer, v_user, v_code, 500, 5);

  INSERT INTO public.user_packs (user_id, tier, count) VALUES (v_user, 'ultra', 5)
    ON CONFLICT (user_id, tier) DO UPDATE SET count = public.user_packs.count + 5;
  INSERT INTO public.user_packs (user_id, tier, count) VALUES (v_referrer, 'ultra', 5)
    ON CONFLICT (user_id, tier) DO UPDATE SET count = public.user_packs.count + 5;

  UPDATE public.profiles
    SET souls = COALESCE(souls, 0) + 500,
        total_souls_earned = COALESCE(total_souls_earned, 0) + 500,
        updated_at = now()
    WHERE user_id = v_referrer;

  RETURN jsonb_build_object('ok', true, 'packs', 5, 'referrer_souls', 500);
END; $$;

-- Expose name_frame everywhere
DROP FUNCTION IF EXISTS public.get_leaderboard(text, integer);
CREATE OR REPLACE FUNCTION public.get_leaderboard(p_season text DEFAULT NULL::text, p_limit integer DEFAULT 100)
RETURNS TABLE(rank bigint, user_id uuid, username text, score numeric, team jsonb, title text, username_color text, name_frame text, avatar_character_id text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  WITH s AS (
    SELECT ls.user_id, ls.score, ls.team
    FROM public.leaderboard_scores ls
    WHERE ls.season_key = COALESCE(p_season, public.current_season_key())
  )
  SELECT RANK() OVER (ORDER BY s.score DESC) AS rank, s.user_id, p.username, s.score, s.team,
    p.title, p.username_color, p.name_frame, p.avatar_character_id
  FROM s JOIN public.profiles p ON p.user_id = s.user_id
  WHERE p.username IS NOT NULL
  ORDER BY s.score DESC, p.username ASC
  LIMIT GREATEST(1, LEAST(500, p_limit));
$$;

DROP FUNCTION IF EXISTS public.get_rival_leaderboard(integer);
CREATE OR REPLACE FUNCTION public.get_rival_leaderboard(p_limit integer DEFAULT 100)
RETURNS TABLE(rank bigint, user_id uuid, username text, rating integer, wins integer, losses integer, title text, username_color text, name_frame text, avatar_character_id text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT RANK() OVER (ORDER BY rs.rating DESC, rs.wins DESC) AS rank,
    rs.user_id, p.username, rs.rating, rs.wins, rs.losses, p.title, p.username_color,
    p.name_frame, p.avatar_character_id
  FROM public.rival_stats rs
  JOIN public.profiles p ON p.user_id = rs.user_id
  WHERE p.username IS NOT NULL
  ORDER BY rs.rating DESC, rs.wins DESC
  LIMIT GREATEST(1, LEAST(500, p_limit));
$$;

DROP FUNCTION IF EXISTS public.get_level_rewards_state();
CREATE OR REPLACE FUNCTION public.get_level_rewards_state()
RETURNS TABLE(level integer, souls integer, title_item text, color_item text, frame_item text, border_item text, badge_item text, name_frame_item text, name_en text, name_ar text, claimed boolean, unlocked boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT c.level, c.souls, c.title_item, c.color_item, c.frame_item, c.border_item, c.badge_item,
         c.name_frame_item, c.name_en, c.name_ar,
         EXISTS(SELECT 1 FROM public.level_rewards_claimed cl WHERE cl.user_id = auth.uid() AND cl.level = c.level),
         c.level <= COALESCE((SELECT level FROM public.player_levels WHERE user_id = auth.uid()), 1)
  FROM public.level_rewards_config c
  ORDER BY c.level;
$$;

CREATE OR REPLACE FUNCTION public.claim_level_reward(p_level integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
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
  PERFORM public.grant_item(v_user, v_cfg.name_frame_item);

  INSERT INTO public.level_rewards_claimed (user_id, level) VALUES (v_user, p_level);

  RETURN jsonb_build_object('ok', true, 'level', p_level, 'souls', v_cfg.souls,
    'title_item', v_cfg.title_item, 'color_item', v_cfg.color_item,
    'frame_item', v_cfg.frame_item, 'border_item', v_cfg.border_item,
    'badge_item', v_cfg.badge_item, 'name_frame_item', v_cfg.name_frame_item);
END; $$;