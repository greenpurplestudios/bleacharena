
-- ============ GLOBAL CHAT ============
CREATE TABLE IF NOT EXISTS public.global_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 300),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS global_messages_created_idx ON public.global_messages (created_at DESC);

GRANT SELECT ON public.global_messages TO authenticated;
GRANT ALL ON public.global_messages TO service_role;
ALTER TABLE public.global_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in users can read global chat"
  ON public.global_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authors and admins can delete global messages"
  ON public.global_messages FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.global_messages REPLICA IDENTITY FULL;
DO $$ BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.global_messages';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.send_global_message(p_content text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_txt text := btrim(p_content);
  v_last timestamptz;
  v_id uuid;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  IF v_txt = '' OR char_length(v_txt) > 300 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_content');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = v_user AND username IS NOT NULL) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_username');
  END IF;
  SELECT max(created_at) INTO v_last FROM public.global_messages WHERE user_id = v_user;
  IF v_last IS NOT NULL AND v_last > now() - interval '2 seconds' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'rate_limited');
  END IF;
  INSERT INTO public.global_messages (user_id, content) VALUES (v_user, v_txt) RETURNING id INTO v_id;
  RETURN jsonb_build_object('ok', true, 'id', v_id);
END; $$;

CREATE OR REPLACE FUNCTION public.get_global_messages(p_limit integer DEFAULT 100)
RETURNS TABLE(id uuid, user_id uuid, username text, username_color text, name_frame text,
              title text, avatar_character_id text, content text, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  RETURN QUERY
    SELECT m.id, m.user_id, p.username, p.username_color, p.name_frame, p.title,
           p.avatar_character_id, m.content, m.created_at
    FROM public.global_messages m
    LEFT JOIN public.profiles p ON p.user_id = m.user_id
    ORDER BY m.created_at DESC
    LIMIT GREATEST(1, LEAST(300, p_limit));
END; $$;

CREATE OR REPLACE FUNCTION public.delete_global_message(p_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid(); v_owner uuid;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  SELECT user_id INTO v_owner FROM public.global_messages WHERE id = p_id;
  IF v_owner IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'not_found'); END IF;
  IF v_owner <> v_user AND NOT public.has_role(v_user, 'admin') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;
  DELETE FROM public.global_messages WHERE id = p_id;
  RETURN jsonb_build_object('ok', true);
END; $$;

-- ============ DIRECT MESSAGES ============
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS dm_pair_idx ON public.direct_messages (sender_id, recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS dm_recipient_idx ON public.direct_messages (recipient_id, read_at);

GRANT SELECT ON public.direct_messages TO authenticated;
GRANT ALL ON public.direct_messages TO service_role;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read their direct messages"
  ON public.direct_messages FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;
DO $$ BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.send_direct_message(p_to uuid, p_content text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_txt text := btrim(p_content);
  v_id uuid;
  v_recent integer;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  IF p_to IS NULL OR p_to = v_user THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_recipient'); END IF;
  IF v_txt = '' OR char_length(v_txt) > 500 THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_content'); END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = p_to AND username IS NOT NULL) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;
  SELECT count(*) INTO v_recent FROM public.direct_messages
   WHERE sender_id = v_user AND created_at > now() - interval '10 seconds';
  IF v_recent >= 10 THEN RETURN jsonb_build_object('ok', false, 'error', 'rate_limited'); END IF;
  INSERT INTO public.direct_messages (sender_id, recipient_id, content)
  VALUES (v_user, p_to, v_txt) RETURNING id INTO v_id;
  RETURN jsonb_build_object('ok', true, 'id', v_id);
END; $$;

CREATE OR REPLACE FUNCTION public.get_direct_messages(p_other uuid, p_limit integer DEFAULT 100)
RETURNS TABLE(id uuid, sender_id uuid, recipient_id uuid, content text, read_at timestamptz, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN RETURN; END IF;
  RETURN QUERY
    SELECT m.id, m.sender_id, m.recipient_id, m.content, m.read_at, m.created_at
    FROM public.direct_messages m
    WHERE (m.sender_id = v_user AND m.recipient_id = p_other)
       OR (m.sender_id = p_other AND m.recipient_id = v_user)
    ORDER BY m.created_at DESC
    LIMIT GREATEST(1, LEAST(300, p_limit));
END; $$;

CREATE OR REPLACE FUNCTION public.get_my_conversations()
RETURNS TABLE(user_id uuid, username text, username_color text, name_frame text,
              avatar_character_id text, last_message text, last_at timestamptz, unread integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN RETURN; END IF;
  RETURN QUERY
  WITH pairs AS (
    SELECT CASE WHEN m.sender_id = v_user THEN m.recipient_id ELSE m.sender_id END AS other,
           m.content, m.created_at, m.read_at, m.recipient_id
    FROM public.direct_messages m
    WHERE m.sender_id = v_user OR m.recipient_id = v_user
  ), agg AS (
    SELECT other,
           max(created_at) AS last_at,
           count(*) FILTER (WHERE recipient_id = v_user AND read_at IS NULL)::int AS unread
    FROM pairs GROUP BY other
  )
  SELECT a.other, p.username, p.username_color, p.name_frame, p.avatar_character_id,
         (SELECT pr.content FROM pairs pr WHERE pr.other = a.other ORDER BY pr.created_at DESC LIMIT 1),
         a.last_at, a.unread
  FROM agg a
  LEFT JOIN public.profiles p ON p.user_id = a.other
  ORDER BY a.last_at DESC;
END; $$;

CREATE OR REPLACE FUNCTION public.mark_conversation_read(p_other uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  UPDATE public.direct_messages SET read_at = now()
   WHERE recipient_id = v_user AND sender_id = p_other AND read_at IS NULL;
  RETURN jsonb_build_object('ok', true);
END; $$;

CREATE OR REPLACE FUNCTION public.get_unread_dm_count()
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(count(*), 0)::int FROM public.direct_messages
   WHERE recipient_id = auth.uid() AND read_at IS NULL;
$$;

-- ============ NAME FRAME IN PROFILE PAYLOADS ============
CREATE OR REPLACE FUNCTION public.get_my_profile_full()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_p public.profiles%ROWTYPE;
  v_lvl public.player_levels%ROWTYPE;
  v_coll integer; v_catalog integer;
  v_rival public.rival_stats%ROWTYPE;
  v_bd public.bleachdle_stats%ROWTYPE;
  v_recent jsonb;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  SELECT * INTO v_p FROM public.profiles WHERE user_id = v_user;
  SELECT * INTO v_lvl FROM public.player_levels WHERE user_id = v_user;
  SELECT COUNT(*) INTO v_coll FROM public.user_collection WHERE user_id = v_user;
  SELECT COUNT(*) INTO v_catalog FROM public.characters_catalog;
  SELECT * INTO v_rival FROM public.rival_stats WHERE user_id = v_user;
  SELECT * INTO v_bd FROM public.bleachdle_stats WHERE user_id = v_user;

  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_recent FROM (
    SELECT c.id, c.name_en, c.name_ar, c.rarity, ua.unlocked_at
    FROM public.user_achievements ua
    JOIN public.achievements_catalog c ON c.id = ua.achievement_id
    WHERE ua.user_id = v_user AND ua.unlocked_at IS NOT NULL
    ORDER BY ua.unlocked_at DESC LIMIT 5
  ) t;

  RETURN jsonb_build_object('ok', true,
    'user_id', v_user,
    'username', v_p.username, 'title', v_p.title, 'username_color', v_p.username_color,
    'avatar_character_id', v_p.avatar_character_id,
    'favorite_character_id', v_p.favorite_character_id,
    'profile_frame', v_p.profile_frame, 'profile_border', v_p.profile_border,
    'name_frame', v_p.name_frame,
    'souls', v_p.souls, 'total_souls_earned', v_p.total_souls_earned,
    'packs_opened', v_p.packs_opened, 'drafts_played', v_p.drafts_played,
    'best_draft_score', v_p.best_draft_score, 'highest_rival_rating', v_p.highest_rival_rating,
    'play_seconds', v_p.play_seconds, 'created_at', v_p.created_at,
    'level', COALESCE(v_lvl.level, 1), 'xp', COALESCE(v_lvl.xp, 0),
    'total_xp', COALESCE(v_lvl.total_xp, 0), 'xp_to_next', public.xp_for_level(COALESCE(v_lvl.level, 1)),
    'collection_owned', v_coll, 'collection_total', v_catalog,
    'rival_rating', COALESCE(v_rival.rating, 1000),
    'rival_wins', COALESCE(v_rival.wins, 0), 'rival_losses', COALESCE(v_rival.losses, 0),
    'bleachdle_best_streak', COALESCE(v_bd.best_streak, 0),
    'bleachdle_current_streak', COALESCE(v_bd.current_streak, 0),
    'recent_achievements', v_recent
  );
END; $$;
