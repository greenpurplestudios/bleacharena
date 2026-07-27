
REVOKE ALL ON FUNCTION public.award_pack_from_score(numeric) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.open_pack(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_my_collection() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_my_packs() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.award_pack_from_score(numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.open_pack(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_collection() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_packs() TO authenticated;
