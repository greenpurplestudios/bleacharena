CREATE OR REPLACE FUNCTION public.admin_set_username(p_user uuid, p_username text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_admin uuid := public.admin_guard();
  v_clean text;
  v_conflict uuid;
  v_old text;
BEGIN
  IF p_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'bad_args');
  END IF;
  v_clean := trim(coalesce(p_username, ''));
  IF length(v_clean) < 2 OR length(v_clean) > 20 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_length');
  END IF;
  IF v_clean !~ '^[A-Za-z0-9_\-]+$' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_chars');
  END IF;

  SELECT user_id INTO v_conflict FROM public.profiles
    WHERE lower(username) = lower(v_clean) AND user_id <> p_user;
  IF v_conflict IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'taken');
  END IF;

  SELECT username INTO v_old FROM public.profiles WHERE user_id = p_user;

  INSERT INTO public.profiles (user_id, username, updated_at)
  VALUES (p_user, v_clean, now())
  ON CONFLICT (user_id) DO UPDATE SET username = EXCLUDED.username, updated_at = now();

  PERFORM public.admin_log(v_admin, 'set_username', p_user,
    jsonb_build_object('from', v_old, 'to', v_clean));
  RETURN jsonb_build_object('ok', true);
END; $$;

REVOKE ALL ON FUNCTION public.admin_set_username(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_username(uuid, text) TO authenticated;

-- Opponent's public username inside an active duel match (no other data exposed)
CREATE OR REPLACE FUNCTION public.duel_opponent_username(p_match uuid)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_me uuid := auth.uid();
  v_other uuid;
BEGIN
  IF v_me IS NULL THEN RETURN NULL; END IF;
  SELECT CASE WHEN host_id = v_me THEN guest_id WHEN guest_id = v_me THEN host_id ELSE NULL END
    INTO v_other FROM public.duel_matches WHERE id = p_match;
  IF v_other IS NULL THEN RETURN NULL; END IF;
  RETURN (SELECT username FROM public.profiles WHERE user_id = v_other);
END; $$;

REVOKE ALL ON FUNCTION public.duel_opponent_username(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.duel_opponent_username(uuid) TO authenticated;