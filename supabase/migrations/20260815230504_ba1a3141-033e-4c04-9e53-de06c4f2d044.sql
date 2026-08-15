CREATE TABLE public.card_overrides (
  character_id text PRIMARY KEY REFERENCES public.characters_catalog(id) ON DELETE CASCADE,
  image_url text,
  focus_x numeric,
  focus_y numeric,
  zoom numeric,
  name_en text,
  name_ar text,
  overall integer,
  rarity text CHECK (rarity IS NULL OR rarity IN ('common','uncommon','rare','epic','legendary','mythic','founder')),
  faction text,
  element text,
  lore_en text,
  lore_ar text,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.card_overrides TO authenticated;
GRANT SELECT ON public.card_overrides TO anon;
GRANT ALL ON public.card_overrides TO service_role;
ALTER TABLE public.card_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "card overrides readable" ON public.card_overrides FOR SELECT USING (true);
CREATE TRIGGER card_overrides_updated_at BEFORE UPDATE ON public.card_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.admin_set_card_override(p_character text, p_patch jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_prev jsonb; v_new jsonb;
BEGIN
  PERFORM public.admin_guard();
  IF NOT EXISTS (SELECT 1 FROM public.characters_catalog WHERE id = p_character) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unknown_card');
  END IF;
  SELECT to_jsonb(o) INTO v_prev FROM public.card_overrides o WHERE character_id = p_character;

  INSERT INTO public.card_overrides AS o (
    character_id, image_url, focus_x, focus_y, zoom, name_en, name_ar,
    overall, rarity, faction, element, lore_en, lore_ar, updated_by)
  VALUES (
    p_character,
    NULLIF(p_patch->>'image_url',''),
    (p_patch->>'focus_x')::numeric, (p_patch->>'focus_y')::numeric, (p_patch->>'zoom')::numeric,
    NULLIF(p_patch->>'name_en',''), NULLIF(p_patch->>'name_ar',''),
    (p_patch->>'overall')::int, NULLIF(p_patch->>'rarity',''),
    NULLIF(p_patch->>'faction',''), NULLIF(p_patch->>'element',''),
    NULLIF(p_patch->>'lore_en',''), NULLIF(p_patch->>'lore_ar',''),
    auth.uid())
  ON CONFLICT (character_id) DO UPDATE SET
    image_url = COALESCE(NULLIF(p_patch->>'image_url',''), o.image_url),
    focus_x = COALESCE((p_patch->>'focus_x')::numeric, o.focus_x),
    focus_y = COALESCE((p_patch->>'focus_y')::numeric, o.focus_y),
    zoom = COALESCE((p_patch->>'zoom')::numeric, o.zoom),
    name_en = COALESCE(NULLIF(p_patch->>'name_en',''), o.name_en),
    name_ar = COALESCE(NULLIF(p_patch->>'name_ar',''), o.name_ar),
    overall = COALESCE((p_patch->>'overall')::int, o.overall),
    rarity = COALESCE(NULLIF(p_patch->>'rarity',''), o.rarity),
    faction = COALESCE(NULLIF(p_patch->>'faction',''), o.faction),
    element = COALESCE(NULLIF(p_patch->>'element',''), o.element),
    lore_en = COALESCE(NULLIF(p_patch->>'lore_en',''), o.lore_en),
    lore_ar = COALESCE(NULLIF(p_patch->>'lore_ar',''), o.lore_ar),
    updated_by = auth.uid();

  SELECT to_jsonb(o) INTO v_new FROM public.card_overrides o WHERE character_id = p_character;
  PERFORM public.admin_log('card_override', NULL,
    jsonb_build_object('character_id', p_character, 'previous', v_prev, 'new', v_new));
  RETURN jsonb_build_object('ok', true);
END; $$;

CREATE OR REPLACE FUNCTION public.admin_clear_card_override(p_character text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_prev jsonb;
BEGIN
  PERFORM public.admin_guard();
  SELECT to_jsonb(o) INTO v_prev FROM public.card_overrides o WHERE character_id = p_character;
  DELETE FROM public.card_overrides WHERE character_id = p_character;
  PERFORM public.admin_log('card_override_revert', NULL,
    jsonb_build_object('character_id', p_character, 'previous', v_prev, 'new', NULL));
  RETURN jsonb_build_object('ok', true);
END; $$;

CREATE OR REPLACE FUNCTION public.get_card_overrides()
RETURNS SETOF public.card_overrides
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM public.card_overrides;
$$;

-- ========================== ANNOUNCEMENTS =============================
CREATE OR REPLACE FUNCTION public.admin_create_news(
  p_title_en text, p_title_ar text, p_body_en text, p_body_ar text,
  p_category text DEFAULT 'announcement', p_pinned boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  PERFORM public.admin_guard();
  IF COALESCE(trim(p_title_en),'') = '' THEN RETURN jsonb_build_object('ok', false, 'error', 'title_required'); END IF;
  INSERT INTO public.news (category, title_en, title_ar, body_en, body_ar, pinned, published_at)
  VALUES (COALESCE(NULLIF(p_category,''),'announcement'), p_title_en, COALESCE(NULLIF(p_title_ar,''), p_title_en),
          COALESCE(p_body_en,''), COALESCE(NULLIF(p_body_ar,''), COALESCE(p_body_en,'')),
          COALESCE(p_pinned,false), now())
  RETURNING id INTO v_id;
  PERFORM public.admin_log('news_create', NULL,
    jsonb_build_object('id', v_id, 'previous', NULL, 'new', jsonb_build_object('title_en', p_title_en)));
  RETURN jsonb_build_object('ok', true, 'id', v_id);
END; $$;

CREATE OR REPLACE FUNCTION public.admin_update_news(
  p_id uuid, p_title_en text, p_title_ar text, p_body_en text, p_body_ar text, p_pinned boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_prev jsonb;
BEGIN
  PERFORM public.admin_guard();
  SELECT to_jsonb(n) INTO v_prev FROM public.news n WHERE id = p_id;
  IF v_prev IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'not_found'); END IF;
  UPDATE public.news SET
    title_en = COALESCE(NULLIF(p_title_en,''), title_en),
    title_ar = COALESCE(NULLIF(p_title_ar,''), title_ar),
    body_en  = COALESCE(p_body_en, body_en),
    body_ar  = COALESCE(p_body_ar, body_ar),
    pinned   = COALESCE(p_pinned, pinned)
  WHERE id = p_id;
  PERFORM public.admin_log('news_update', NULL,
    jsonb_build_object('id', p_id, 'previous', v_prev,
      'new', (SELECT to_jsonb(n) FROM public.news n WHERE id = p_id)));
  RETURN jsonb_build_object('ok', true);
END; $$;

CREATE OR REPLACE FUNCTION public.admin_delete_news(p_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_prev jsonb;
BEGIN
  PERFORM public.admin_guard();
  SELECT to_jsonb(n) INTO v_prev FROM public.news n WHERE id = p_id;
  DELETE FROM public.news WHERE id = p_id;
  PERFORM public.admin_log('news_delete', NULL,
    jsonb_build_object('id', p_id, 'previous', v_prev, 'new', NULL));
  RETURN jsonb_build_object('ok', true);
END; $$;

CREATE OR REPLACE FUNCTION public.admin_list_news()
RETURNS TABLE (id uuid, category text, title_en text, title_ar text,
               body_en text, body_ar text, pinned boolean, published_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.admin_guard();
  RETURN QUERY SELECT n.id, n.category, n.title_en, n.title_ar, n.body_en, n.body_ar, n.pinned, n.published_at
  FROM public.news n ORDER BY n.pinned DESC, n.published_at DESC LIMIT 100;
END; $$;