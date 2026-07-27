
-- Characters catalog (authoritative source of rarity for RPCs)
CREATE TABLE public.characters_catalog (
  id text PRIMARY KEY,
  overall int NOT NULL,
  rarity text NOT NULL CHECK (rarity IN ('common','uncommon','rare','epic','legendary','mythic'))
);
GRANT SELECT ON public.characters_catalog TO authenticated;
GRANT ALL ON public.characters_catalog TO service_role;
ALTER TABLE public.characters_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "catalog readable by authenticated" ON public.characters_catalog FOR SELECT TO authenticated USING (true);

-- Seed catalog
INSERT INTO public.characters_catalog (id, overall, rarity) VALUES
('c-001',96,'mythic'),('c-002',88,'epic'),('c-003',92,'legendary'),('c-004',93,'legendary'),('c-005',89,'epic'),
('c-006',84,'rare'),('c-007',87,'epic'),('c-008',90,'legendary'),('c-009',91,'legendary'),('c-010',94,'legendary'),
('c-011',88,'epic'),('c-012',92,'legendary'),('c-013',62,'common'),('c-014',76,'uncommon'),('c-015',90,'legendary'),
('c-016',74,'common'),('c-017',98,'mythic'),('c-018',97,'mythic'),('c-019',95,'mythic'),('c-020',89,'epic'),
('c-021',87,'epic'),('c-022',85,'epic'),('c-023',93,'legendary'),('c-024',91,'legendary'),('c-025',94,'legendary'),
('c-026',83,'rare'),('c-027',92,'legendary'),('c-028',95,'mythic'),('c-029',18,'common'),('c-030',92,'legendary'),
('c-031',78,'uncommon'),('c-032',75,'uncommon'),('c-033',100,'mythic'),('c-034',42,'common'),('c-035',32,'common'),
('c-036',52,'common'),('c-037',20,'common'),('c-038',24,'common'),('c-039',50,'common'),('c-040',33,'common'),
('c-041',93,'legendary'),('c-042',86,'epic'),('c-043',87,'epic'),('c-044',92,'legendary'),('c-045',90,'legendary'),
('c-046',90,'legendary'),('c-047',86,'epic'),('c-048',87,'epic'),('c-049',82,'rare'),('c-050',99,'mythic'),
('c-051',92,'legendary'),('c-052',87,'epic'),('c-053',85,'epic'),('c-054',91,'legendary'),('c-055',91,'legendary'),
('c-056',90,'legendary'),('c-057',88,'epic');

-- User collection
CREATE TABLE public.user_collection (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id text NOT NULL REFERENCES public.characters_catalog(id) ON DELETE CASCADE,
  count int NOT NULL DEFAULT 1,
  first_obtained_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, character_id)
);
GRANT SELECT ON public.user_collection TO authenticated;
GRANT ALL ON public.user_collection TO service_role;
ALTER TABLE public.user_collection ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own collection readable" ON public.user_collection FOR SELECT TO authenticated USING (user_id = auth.uid());

-- User packs
CREATE TABLE public.user_packs (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier text NOT NULL CHECK (tier IN ('bronze','silver','gold','ultra','legend')),
  count int NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, tier)
);
GRANT SELECT ON public.user_packs TO authenticated;
GRANT ALL ON public.user_packs TO service_role;
ALTER TABLE public.user_packs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own packs readable" ON public.user_packs FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Helper: pack tier from score
CREATE OR REPLACE FUNCTION public.pack_tier_from_score(p_score numeric)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN p_score >= 95 THEN 'legend'
    WHEN p_score >= 90 THEN 'ultra'
    WHEN p_score >= 86 THEN 'gold'
    WHEN p_score >= 81 THEN 'silver'
    WHEN p_score >= 75 THEN 'bronze'
    ELSE NULL
  END;
$$;

-- Award a pack from a draft score
CREATE OR REPLACE FUNCTION public.award_pack_from_score(p_score numeric)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_tier text;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  v_tier := public.pack_tier_from_score(p_score);
  IF v_tier IS NULL THEN RETURN jsonb_build_object('ok', true, 'awarded', false); END IF;

  INSERT INTO public.user_packs (user_id, tier, count) VALUES (v_user, v_tier, 1)
  ON CONFLICT (user_id, tier) DO UPDATE SET count = public.user_packs.count + 1;

  RETURN jsonb_build_object('ok', true, 'awarded', true, 'tier', v_tier);
END;
$$;

-- Open a pack
CREATE OR REPLACE FUNCTION public.open_pack(p_tier text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_have int;
  v_weights jsonb;
  v_r numeric;
  v_rarity text;
  v_char_id text;
  v_dup boolean := false;
  v_souls int := 0;
  v_overall int;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  IF p_tier NOT IN ('bronze','silver','gold','ultra','legend') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_tier');
  END IF;

  SELECT count INTO v_have FROM public.user_packs WHERE user_id = v_user AND tier = p_tier;
  IF COALESCE(v_have, 0) < 1 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_packs');
  END IF;

  UPDATE public.user_packs SET count = count - 1 WHERE user_id = v_user AND tier = p_tier;

  v_weights := CASE p_tier
    WHEN 'bronze' THEN '{"common":60,"uncommon":30,"rare":10}'::jsonb
    WHEN 'silver' THEN '{"uncommon":50,"rare":35,"epic":15}'::jsonb
    WHEN 'gold'   THEN '{"rare":45,"epic":40,"legendary":15}'::jsonb
    WHEN 'ultra'  THEN '{"epic":45,"legendary":45,"mythic":10}'::jsonb
    WHEN 'legend' THEN '{"legendary":65,"mythic":35}'::jsonb
  END;

  v_r := random() * 100;

  WITH ordered AS (
    SELECT k, (v_weights->>k)::numeric AS w
    FROM jsonb_object_keys(v_weights) k
  ),
  cum AS (
    SELECT k, SUM(w) OVER (ORDER BY w) AS c FROM ordered
  )
  SELECT k INTO v_rarity FROM cum WHERE c >= v_r ORDER BY c ASC LIMIT 1;

  IF v_rarity IS NULL THEN
    SELECT k INTO v_rarity FROM jsonb_object_keys(v_weights) k LIMIT 1;
  END IF;

  SELECT id, overall INTO v_char_id, v_overall
  FROM public.characters_catalog WHERE rarity = v_rarity ORDER BY random() LIMIT 1;

  IF v_char_id IS NULL THEN
    SELECT id, overall, rarity INTO v_char_id, v_overall, v_rarity
    FROM public.characters_catalog ORDER BY random() LIMIT 1;
  END IF;

  SELECT true INTO v_dup FROM public.user_collection
    WHERE user_id = v_user AND character_id = v_char_id;
  v_dup := COALESCE(v_dup, false);

  IF v_dup THEN
    UPDATE public.user_collection SET count = count + 1
      WHERE user_id = v_user AND character_id = v_char_id;
    v_souls := CASE v_rarity
      WHEN 'common' THEN 5
      WHEN 'uncommon' THEN 10
      WHEN 'rare' THEN 25
      WHEN 'epic' THEN 60
      WHEN 'legendary' THEN 150
      WHEN 'mythic' THEN 400
      ELSE 0
    END;
    UPDATE public.profiles SET souls = COALESCE(souls,0) + v_souls, updated_at = now()
      WHERE user_id = v_user;
  ELSE
    INSERT INTO public.user_collection (user_id, character_id, count)
      VALUES (v_user, v_char_id, 1);
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'character_id', v_char_id,
    'rarity', v_rarity,
    'overall', v_overall,
    'duplicate', v_dup,
    'souls_awarded', v_souls
  );
END;
$$;

-- Convenience readers
CREATE OR REPLACE FUNCTION public.get_my_collection()
RETURNS TABLE(character_id text, count int, rarity text, overall int, first_obtained_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT uc.character_id, uc.count, cc.rarity, cc.overall, uc.first_obtained_at
  FROM public.user_collection uc
  JOIN public.characters_catalog cc ON cc.id = uc.character_id
  WHERE uc.user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_my_packs()
RETURNS TABLE(tier text, count int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT tier, count FROM public.user_packs WHERE user_id = auth.uid() AND count > 0;
$$;
