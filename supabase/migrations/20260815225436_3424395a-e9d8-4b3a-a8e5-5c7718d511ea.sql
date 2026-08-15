ALTER TABLE public.characters_catalog DROP CONSTRAINT IF EXISTS characters_catalog_rarity_check;
ALTER TABLE public.characters_catalog ADD CONSTRAINT characters_catalog_rarity_check
  CHECK (rarity = ANY (ARRAY['common','uncommon','rare','epic','legendary','mythic','founder']));

INSERT INTO public.characters_catalog (id, overall, rarity, gender) VALUES
  ('c-f01', 99, 'founder', 'male'),
  ('c-f02', 95, 'founder', 'male'),
  ('c-f03', 97, 'founder', 'male'),
  ('c-f04', 98, 'founder', 'male'),
  ('c-f05', 97, 'founder', 'male')
ON CONFLICT (id) DO UPDATE SET overall = EXCLUDED.overall, rarity = EXCLUDED.rarity;

CREATE TABLE IF NOT EXISTS public.founder_window (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.founder_window TO authenticated;
GRANT SELECT ON public.founder_window TO anon;
GRANT ALL ON public.founder_window TO service_role;
ALTER TABLE public.founder_window ENABLE ROW LEVEL SECURITY;
CREATE POLICY "founder window readable" ON public.founder_window FOR SELECT USING (true);

INSERT INTO public.founder_window (id, starts_at, ends_at)
VALUES (true, now(), now() + interval '7 days')
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.founders_active()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.founder_window WHERE now() BETWEEN starts_at AND ends_at);
$$;

CREATE OR REPLACE FUNCTION public.get_founder_window()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT jsonb_build_object('starts_at', starts_at, 'ends_at', ends_at,
                               'active', now() BETWEEN starts_at AND ends_at)
     FROM public.founder_window LIMIT 1),
    jsonb_build_object('active', false));
$$;

CREATE OR REPLACE FUNCTION public.open_pack(p_tier text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

  -- Founder chance: gold/ultra/legend only, and only inside the 7-day window.
  IF public.founders_active() THEN
    v_founder_odds := CASE p_tier
      WHEN 'gold'   THEN 1.0/5000.0
      WHEN 'ultra'  THEN 1.0/1500.0
      WHEN 'legend' THEN 1.0/400.0
      ELSE 0 END;
  END IF;

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
      WHEN 'common' THEN 5
      WHEN 'uncommon' THEN 10
      WHEN 'rare' THEN 25
      WHEN 'epic' THEN 60
      WHEN 'legendary' THEN 150
      WHEN 'mythic' THEN 400
      WHEN 'founder' THEN 2500
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
$function$;