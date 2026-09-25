-- Allow admins to create brand-new cards without code changes.
CREATE OR REPLACE FUNCTION public.admin_create_custom_card(p_id text, p_patch jsonb)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_admin uuid := public.admin_guard();
  v_id text := lower(regexp_replace(coalesce(p_id, ''), '[^a-zA-Z0-9_-]', '-', 'g'));
  v_overall int := coalesce((p_patch->>'overall')::int, 80);
  v_rarity text := coalesce(NULLIF(p_patch->>'rarity',''), 'rare');
  v_gender text := coalesce(NULLIF(p_patch->>'gender',''), 'male');
BEGIN
  IF v_id IS NULL OR length(v_id) < 2 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_id');
  END IF;
  IF EXISTS (SELECT 1 FROM public.characters_catalog WHERE id = v_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'card_exists');
  END IF;
  IF v_overall < 1 OR v_overall > 100 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_overall');
  END IF;
  IF NULLIF(p_patch->>'name_en','') IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'name_required');
  END IF;

  INSERT INTO public.characters_catalog (id, overall, rarity, gender)
  VALUES (v_id, v_overall, v_rarity, v_gender);

  INSERT INTO public.card_overrides (
    character_id, image_url, focus_x, focus_y, zoom, name_en, name_ar,
    overall, rarity, faction, element, lore_en, lore_ar, updated_by)
  VALUES (
    v_id,
    NULLIF(p_patch->>'image_url',''),
    coalesce((p_patch->>'focus_x')::numeric, 50),
    coalesce((p_patch->>'focus_y')::numeric, 26),
    coalesce((p_patch->>'zoom')::numeric, 1.06),
    NULLIF(p_patch->>'name_en',''),
    coalesce(NULLIF(p_patch->>'name_ar',''), NULLIF(p_patch->>'name_en','')),
    v_overall, v_rarity,
    NULLIF(p_patch->>'faction',''), NULLIF(p_patch->>'element',''),
    NULLIF(p_patch->>'lore_en',''), NULLIF(p_patch->>'lore_ar',''),
    v_admin);

  PERFORM public.admin_log(v_admin, 'card_create', NULL,
    jsonb_build_object('character_id', v_id, 'patch', p_patch));
  RETURN jsonb_build_object('ok', true, 'id', v_id);
END; $function$;

REVOKE ALL ON FUNCTION public.admin_create_custom_card(text, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_create_custom_card(text, jsonb) TO authenticated;

-- Remove a custom card (only cards that were created through the admin tools).
CREATE OR REPLACE FUNCTION public.admin_delete_custom_card(p_id text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_admin uuid := public.admin_guard(); v_created boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.admin_audit_log
    WHERE action = 'card_create' AND details->>'character_id' = p_id
  ) INTO v_created;
  IF NOT v_created THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_a_custom_card');
  END IF;

  DELETE FROM public.market_listings WHERE character_id = p_id;
  DELETE FROM public.user_collection WHERE character_id = p_id;
  DELETE FROM public.card_overrides WHERE character_id = p_id;
  DELETE FROM public.characters_catalog WHERE id = p_id;

  PERFORM public.admin_log(v_admin, 'card_delete', NULL,
    jsonb_build_object('character_id', p_id));
  RETURN jsonb_build_object('ok', true);
END; $function$;

REVOKE ALL ON FUNCTION public.admin_delete_custom_card(text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_delete_custom_card(text) TO authenticated;

-- List every card id the admin tools created, so the app can build them at runtime.
CREATE OR REPLACE FUNCTION public.get_custom_card_ids()
 RETURNS TABLE(character_id text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT DISTINCT details->>'character_id'
  FROM public.admin_audit_log
  WHERE action = 'card_create' AND details->>'character_id' IS NOT NULL;
$function$;

REVOKE ALL ON FUNCTION public.get_custom_card_ids() FROM public;
GRANT EXECUTE ON FUNCTION public.get_custom_card_ids() TO authenticated, anon;
