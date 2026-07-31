GRANT SELECT ON public.clans TO authenticated;
GRANT SELECT ON public.clan_members TO authenticated;
GRANT SELECT ON public.clan_join_requests TO authenticated;
GRANT SELECT ON public.clan_messages TO authenticated;
GRANT ALL ON public.clans TO service_role;
GRANT ALL ON public.clan_members TO service_role;
GRANT ALL ON public.clan_join_requests TO service_role;
GRANT ALL ON public.clan_messages TO service_role;