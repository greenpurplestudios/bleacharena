
-- Store catalog
CREATE TABLE public.store_items (
  id text PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('title','username_color','pack')),
  name_en text NOT NULL,
  name_ar text NOT NULL,
  cost integer NOT NULL CHECK (cost >= 0),
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.store_items TO authenticated;
GRANT ALL ON public.store_items TO service_role;
ALTER TABLE public.store_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "store readable by authenticated" ON public.store_items FOR SELECT TO authenticated USING (active);

-- User inventory
CREATE TABLE public.user_inventory (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id text NOT NULL REFERENCES public.store_items(id) ON DELETE CASCADE,
  acquired_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_id)
);
GRANT SELECT ON public.user_inventory TO authenticated;
GRANT ALL ON public.user_inventory TO service_role;
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own inventory readable" ON public.user_inventory FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Seed items
INSERT INTO public.store_items (id, kind, name_en, name_ar, cost, meta, sort_order) VALUES
  ('title_soul_reaper','title','Soul Reaper','شينيغامي',150,'{"value_en":"Soul Reaper","value_ar":"شينيغامي"}',10),
  ('title_hollow_slayer','title','Hollow Slayer','قاتل الهولو',300,'{"value_en":"Hollow Slayer","value_ar":"قاتل الهولو"}',11),
  ('title_captain','title','Captain','قائد',600,'{"value_en":"Captain","value_ar":"قائد"}',12),
  ('title_espada','title','Espada','إسبادا',900,'{"value_en":"Espada","value_ar":"إسبادا"}',13),
  ('title_sternritter','title','Sternritter','شترنريتر',1200,'{"value_en":"Sternritter","value_ar":"شترنريتر"}',14),
  ('title_soul_king','title','Soul King','ملك الأرواح',3000,'{"value_en":"Soul King","value_ar":"ملك الأرواح"}',15),
  ('color_reiatsu_blue','username_color','Reiatsu Blue','أزرق الرياتسو',200,'{"hex":"#3b82f6"}',20),
  ('color_hollow_red','username_color','Hollow Red','أحمر الهولو',400,'{"hex":"#ef4444"}',21),
  ('color_zanpakuto_gold','username_color','Zanpakuto Gold','ذهبي الزانباكتو',700,'{"hex":"#eab308"}',22),
  ('color_quincy_silver','username_color','Quincy Silver','فضي الكوينسي',1000,'{"hex":"#e5e7eb"}',23),
  ('color_king_violet','username_color','King Violet','بنفسجي الملك',1800,'{"hex":"#a855f7"}',24),
  ('pack_bronze','pack','Bronze Pack','باكت برونزي',100,'{"tier":"bronze"}',1),
  ('pack_silver','pack','Silver Pack','باكت فضي',250,'{"tier":"silver"}',2),
  ('pack_gold','pack','Gold Pack','باكت ذهبي',600,'{"tier":"gold"}',3),
  ('pack_ultra','pack','Ultra Pack','باكت ألترا',1400,'{"tier":"ultra"}',4),
  ('pack_legend','pack','Legend Pack','باكت أسطوري',3500,'{"tier":"legend"}',5);

-- Purchase item
CREATE OR REPLACE FUNCTION public.purchase_item(p_item_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_item public.store_items%ROWTYPE;
  v_souls int;
  v_owned boolean;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  SELECT * INTO v_item FROM public.store_items WHERE id = p_item_id AND active;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'not_found'); END IF;

  SELECT COALESCE(souls,0) INTO v_souls FROM public.profiles WHERE user_id = v_user;
  IF v_souls < v_item.cost THEN
    RETURN jsonb_build_object('ok', false, 'error', 'insufficient_souls', 'souls', v_souls, 'cost', v_item.cost);
  END IF;

  IF v_item.kind IN ('title','username_color') THEN
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
  ELSE
    INSERT INTO public.user_inventory (user_id, item_id) VALUES (v_user, v_item.id);
  END IF;

  RETURN jsonb_build_object('ok', true, 'item_id', v_item.id, 'kind', v_item.kind, 'cost', v_item.cost);
END;
$$;

-- Equip item (title or username color); pass NULL to unequip that slot
CREATE OR REPLACE FUNCTION public.equip_item(p_kind text, p_item_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_item public.store_items%ROWTYPE;
  v_owned boolean;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  IF p_kind NOT IN ('title','username_color') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_kind');
  END IF;

  IF p_item_id IS NULL THEN
    IF p_kind = 'title' THEN
      UPDATE public.profiles SET title = NULL, updated_at = now() WHERE user_id = v_user;
    ELSE
      UPDATE public.profiles SET username_color = NULL, updated_at = now() WHERE user_id = v_user;
    END IF;
    RETURN jsonb_build_object('ok', true, 'unequipped', true);
  END IF;

  SELECT * INTO v_item FROM public.store_items WHERE id = p_item_id AND kind = p_kind AND active;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'not_found'); END IF;

  SELECT true INTO v_owned FROM public.user_inventory WHERE user_id = v_user AND item_id = v_item.id;
  IF NOT COALESCE(v_owned, false) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_owned');
  END IF;

  IF p_kind = 'title' THEN
    UPDATE public.profiles SET title = v_item.id, updated_at = now() WHERE user_id = v_user;
  ELSE
    UPDATE public.profiles SET username_color = (v_item.meta->>'hex'), updated_at = now() WHERE user_id = v_user;
  END IF;

  RETURN jsonb_build_object('ok', true, 'item_id', v_item.id);
END;
$$;

-- Fetch store + ownership flag
CREATE OR REPLACE FUNCTION public.get_store()
RETURNS TABLE(id text, kind text, name_en text, name_ar text, cost integer, meta jsonb, sort_order integer, owned boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.id, s.kind, s.name_en, s.name_ar, s.cost, s.meta, s.sort_order,
    CASE WHEN s.kind = 'pack' THEN false
         ELSE EXISTS (SELECT 1 FROM public.user_inventory ui WHERE ui.user_id = auth.uid() AND ui.item_id = s.id)
    END AS owned
  FROM public.store_items s
  WHERE s.active
  ORDER BY s.kind, s.sort_order, s.cost;
$$;

-- Fetch inventory with item details
CREATE OR REPLACE FUNCTION public.get_my_inventory()
RETURNS TABLE(item_id text, kind text, name_en text, name_ar text, meta jsonb, acquired_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.id, s.kind, s.name_en, s.name_ar, s.meta, ui.acquired_at
  FROM public.user_inventory ui
  JOIN public.store_items s ON s.id = ui.item_id
  WHERE ui.user_id = auth.uid()
  ORDER BY ui.acquired_at DESC;
$$;
