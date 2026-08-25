INSERT INTO public.characters_catalog (id, overall, rarity, gender)
VALUES ('c-f06', 99, 'founder', 'female')
ON CONFLICT (id) DO UPDATE SET overall = EXCLUDED.overall, rarity = EXCLUDED.rarity, gender = EXCLUDED.gender;

CREATE OR REPLACE FUNCTION public.open_pack(p_tier text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
  v_founder_odds numeric := 0;
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

  -- Founder chance: gold/ultra/legend only. Permanently available.
  v_founder_odds := CASE p_tier
    WHEN 'gold'   THEN 1.0/5000.0
    WHEN 'ultra'  THEN 1.0/1500.0
    WHEN 'legend' THEN 1.0/400.0
    ELSE 0 END;

  IF v_founder_odds > 0 AND random() < v_founder_odds THEN
    v_rarity := 'founder';
    SELECT id, overall INTO v_char_id, v_overall
    FROM public.characters_catalog WHERE rarity = 'founder' ORDER BY random() LIMIT 1;
  END IF;

  IF v_char_id IS NULL THEN
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
      FROM public.characters_catalog WHERE rarity <> 'founder' ORDER BY random() LIMIT 1;
    END IF;
  END IF;

  SELECT true INTO v_dup FROM public.user_collection
    WHERE user_id = v_user AND character_id = v_char_id;
  v_dup := COALESCE(v_dup, false);

  IF v_dup THEN
    UPDATE public.user_collection SET count = count + 1
      WHERE user_id = v_user AND character_id = v_char_id;
    v_souls := CASE v_rarity
      WHEN 'common' THEN 5 WHEN 'uncommon' THEN 10 WHEN 'rare' THEN 25
      WHEN 'epic' THEN 60 WHEN 'legendary' THEN 150 WHEN 'mythic' THEN 400
      WHEN 'founder' THEN 2500 ELSE 5 END;
    UPDATE public.profiles
      SET souls = souls + v_souls,
          total_souls_earned = total_souls_earned + v_souls,
          packs_opened = packs_opened + 1
      WHERE user_id = v_user;
  ELSE
    INSERT INTO public.user_collection (user_id, character_id, count)
      VALUES (v_user, v_char_id, 1);
    UPDATE public.profiles SET packs_opened = packs_opened + 1 WHERE user_id = v_user;
  END IF;

  RETURN jsonb_build_object('ok', true, 'character_id', v_char_id, 'rarity', v_rarity,
    'overall', v_overall, 'duplicate', v_dup, 'souls_awarded', v_souls);
END;
$function$;