ALTER TABLE public.store_items DROP CONSTRAINT IF EXISTS store_items_kind_check;
ALTER TABLE public.store_items ADD CONSTRAINT store_items_kind_check CHECK (kind IN ('title','username_color','name_frame','frame','border','pack','potion','name_effect','profile_badge','leaderboard_style'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS name_effect text,
  ADD COLUMN IF NOT EXISTS profile_badge text,
  ADD COLUMN IF NOT EXISTS leaderboard_style text;

CREATE OR REPLACE FUNCTION public.equip_item(p_kind text, p_item_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_item public.store_items%ROWTYPE;
  v_owned boolean;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  IF p_kind NOT IN ('title','username_color','frame','border','name_frame','name_effect','profile_badge','leaderboard_style') THEN
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
    ELSIF p_kind = 'name_effect' THEN
      UPDATE public.profiles SET name_effect = NULL, updated_at = now() WHERE user_id = v_user;
    ELSIF p_kind = 'profile_badge' THEN
      UPDATE public.profiles SET profile_badge = NULL, updated_at = now() WHERE user_id = v_user;
    ELSIF p_kind = 'leaderboard_style' THEN
      UPDATE public.profiles SET leaderboard_style = NULL, updated_at = now() WHERE user_id = v_user;
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
  ELSIF p_kind = 'name_effect' THEN
    UPDATE public.profiles SET name_effect = v_item.id, updated_at = now() WHERE user_id = v_user;
  ELSIF p_kind = 'profile_badge' THEN
    UPDATE public.profiles SET profile_badge = v_item.id, updated_at = now() WHERE user_id = v_user;
  ELSIF p_kind = 'leaderboard_style' THEN
    UPDATE public.profiles SET leaderboard_style = v_item.id, updated_at = now() WHERE user_id = v_user;
  END IF;

  RETURN jsonb_build_object('ok', true, 'item_id', v_item.id);
END; $function$;

CREATE OR REPLACE FUNCTION public.set_rival_team(p_slots jsonb, p_index integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_user uuid := auth.uid(); v_ids text[]; v_id text; v_count int; v_clash text;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  IF p_index IS NULL OR p_index < 0 OR p_index > 3 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_team'); END IF;
  IF jsonb_typeof(p_slots) <> 'array' OR jsonb_array_length(p_slots) <> 5 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'need_five'); END IF;
  SELECT array_agg(value::text) INTO v_ids FROM jsonb_array_elements_text(p_slots) value;
  IF (SELECT COUNT(DISTINCT x) FROM unnest(v_ids) x) <> 5 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'duplicates'); END IF;
  FOREACH v_id IN ARRAY v_ids LOOP
    SELECT 1 INTO v_count FROM public.user_collection WHERE user_id = v_user AND character_id = v_id LIMIT 1;
    IF v_count IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'not_owned', 'character_id', v_id); END IF;
    v_count := NULL;
  END LOOP;

  SELECT s.value::text INTO v_clash
  FROM public.rival_teams rt
  CROSS JOIN LATERAL jsonb_array_elements_text(rt.slots) s(value)
  WHERE rt.user_id = v_user AND rt.team_index <> p_index
    AND s.value::text = ANY(v_ids)
  LIMIT 1;
  IF v_clash IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'card_in_other_team', 'character_id', v_clash);
  END IF;

  INSERT INTO public.rival_teams (user_id, team_index, slots, updated_at)
  VALUES (v_user, p_index, p_slots, now())
  ON CONFLICT (user_id, team_index) DO UPDATE SET slots = EXCLUDED.slots, updated_at = now();
  RETURN jsonb_build_object('ok', true);
END; $function$;