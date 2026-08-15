CREATE OR REPLACE FUNCTION public.get_public_collection(p_user uuid)
RETURNS TABLE (character_id text, count integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT uc.character_id, uc.count
  FROM public.user_collection uc
  WHERE uc.user_id = p_user AND auth.uid() IS NOT NULL
  ORDER BY uc.character_id;
$$;
REVOKE EXECUTE ON FUNCTION public.get_public_collection(uuid) FROM anon;