
CREATE TABLE public.duel_forge (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  fragments integer NOT NULL DEFAULT 0,
  equipped_weapon text NOT NULL DEFAULT 'zangetsu',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.duel_forge TO authenticated;
GRANT ALL ON public.duel_forge TO service_role;
ALTER TABLE public.duel_forge ENABLE ROW LEVEL SECURITY;
CREATE POLICY "forge_own_select" ON public.duel_forge FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.duel_weapons (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weapon_id text NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, weapon_id)
);
GRANT SELECT ON public.duel_weapons TO authenticated;
GRANT ALL ON public.duel_weapons TO service_role;
ALTER TABLE public.duel_weapons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "weapons_own_select" ON public.duel_weapons FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.duel_weapon_catalog (
  weapon_id text PRIMARY KEY,
  fragment_cost integer NOT NULL,
  soul_cost integer NOT NULL,
  starter boolean NOT NULL DEFAULT false
);
GRANT SELECT ON public.duel_weapon_catalog TO authenticated, anon;
GRANT ALL ON public.duel_weapon_catalog TO service_role;
ALTER TABLE public.duel_weapon_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "catalog_public_read" ON public.duel_weapon_catalog FOR SELECT TO authenticated, anon USING (true);

INSERT INTO public.duel_weapon_catalog (weapon_id, fragment_cost, soul_cost, starter) VALUES
  ('zangetsu', 0, 0, true),
  ('hado-90', 60, 1500, false),
  ('sakanade', 60, 1500, false),
  ('daiguren-hyorinmaru', 70, 1800, false),
  ('enma-korogi', 70, 1800, false),
  ('kannon-biraki', 90, 2200, false),
  ('ichimonji', 100, 2500, false),
  ('kyoka-suigetsu', 100, 2500, false),
  ('the-almighty', 120, 3000, false);

CREATE OR REPLACE FUNCTION public.get_forge()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  frow public.duel_forge;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;

  INSERT INTO public.duel_forge (user_id) VALUES (uid) ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.duel_weapons (user_id, weapon_id)
    SELECT uid, weapon_id FROM public.duel_weapon_catalog WHERE starter
    ON CONFLICT DO NOTHING;

  SELECT * INTO frow FROM public.duel_forge WHERE user_id = uid;

  RETURN jsonb_build_object(
    'ok', true,
    'fragments', frow.fragments,
    'equipped', frow.equipped_weapon,
    'souls', (SELECT souls FROM public.profiles WHERE user_id = uid),
    'weapons', COALESCE((SELECT jsonb_agg(weapon_id) FROM public.duel_weapons WHERE user_id = uid), '[]'::jsonb),
    'catalog', COALESCE((SELECT jsonb_agg(jsonb_build_object('weapon_id', weapon_id, 'fragment_cost', fragment_cost, 'soul_cost', soul_cost, 'starter', starter)) FROM public.duel_weapon_catalog), '[]'::jsonb)
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_forge() TO authenticated;

CREATE OR REPLACE FUNCTION public.award_fragments(p_amount integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  amt integer := GREATEST(0, LEAST(COALESCE(p_amount, 0), 40));
  total integer;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  INSERT INTO public.duel_forge (user_id, fragments) VALUES (uid, amt)
    ON CONFLICT (user_id) DO UPDATE SET fragments = public.duel_forge.fragments + amt, updated_at = now()
    RETURNING fragments INTO total;
  RETURN jsonb_build_object('ok', true, 'fragments', total, 'awarded', amt);
END;
$$;
GRANT EXECUTE ON FUNCTION public.award_fragments(integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.forge_weapon(p_weapon_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  cat public.duel_weapon_catalog;
  have_frag integer;
  have_souls integer;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  SELECT * INTO cat FROM public.duel_weapon_catalog WHERE weapon_id = p_weapon_id;
  IF cat IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'not_found'); END IF;
  IF EXISTS (SELECT 1 FROM public.duel_weapons WHERE user_id = uid AND weapon_id = p_weapon_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_owned');
  END IF;

  INSERT INTO public.duel_forge (user_id) VALUES (uid) ON CONFLICT (user_id) DO NOTHING;
  SELECT fragments INTO have_frag FROM public.duel_forge WHERE user_id = uid FOR UPDATE;
  SELECT souls INTO have_souls FROM public.profiles WHERE user_id = uid FOR UPDATE;

  IF have_frag < cat.fragment_cost THEN RETURN jsonb_build_object('ok', false, 'error', 'insufficient_fragments'); END IF;
  IF COALESCE(have_souls, 0) < cat.soul_cost THEN RETURN jsonb_build_object('ok', false, 'error', 'insufficient_souls'); END IF;

  UPDATE public.duel_forge SET fragments = fragments - cat.fragment_cost, updated_at = now() WHERE user_id = uid;
  UPDATE public.profiles SET souls = souls - cat.soul_cost WHERE user_id = uid;
  INSERT INTO public.duel_weapons (user_id, weapon_id) VALUES (uid, p_weapon_id);

  RETURN jsonb_build_object('ok', true, 'weapon_id', p_weapon_id,
    'fragments', have_frag - cat.fragment_cost, 'souls', have_souls - cat.soul_cost);
END;
$$;
GRANT EXECUTE ON FUNCTION public.forge_weapon(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.equip_weapon(p_weapon_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  IF NOT EXISTS (SELECT 1 FROM public.duel_weapons WHERE user_id = uid AND weapon_id = p_weapon_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_owned');
  END IF;
  INSERT INTO public.duel_forge (user_id, equipped_weapon) VALUES (uid, p_weapon_id)
    ON CONFLICT (user_id) DO UPDATE SET equipped_weapon = p_weapon_id, updated_at = now();
  RETURN jsonb_build_object('ok', true, 'equipped', p_weapon_id);
END;
$$;
GRANT EXECUTE ON FUNCTION public.equip_weapon(text) TO authenticated;
