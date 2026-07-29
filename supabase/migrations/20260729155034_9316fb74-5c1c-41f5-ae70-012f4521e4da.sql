
CREATE TYPE public.clan_role AS ENUM ('leader', 'officer', 'member');

CREATE TABLE public.clans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag text NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  leader_id uuid NOT NULL,
  member_count integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT clans_tag_len CHECK (char_length(tag) BETWEEN 2 AND 5),
  CONSTRAINT clans_name_len CHECK (char_length(name) BETWEEN 3 AND 24),
  CONSTRAINT clans_desc_len CHECK (char_length(description) <= 240)
);
CREATE UNIQUE INDEX clans_tag_lower_key ON public.clans (lower(tag));
CREATE UNIQUE INDEX clans_name_lower_key ON public.clans (lower(name));

GRANT SELECT ON public.clans TO authenticated;
GRANT ALL ON public.clans TO service_role;
ALTER TABLE public.clans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clans readable to authenticated" ON public.clans FOR SELECT TO authenticated USING (true);

CREATE TABLE public.clan_members (
  clan_id uuid NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL UNIQUE,
  role public.clan_role NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (clan_id, user_id)
);
GRANT SELECT ON public.clan_members TO authenticated;
GRANT ALL ON public.clan_members TO service_role;
ALTER TABLE public.clan_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clan members readable" ON public.clan_members FOR SELECT TO authenticated USING (true);

CREATE TABLE public.clan_join_requests (
  clan_id uuid NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (clan_id, user_id)
);
GRANT SELECT ON public.clan_join_requests TO authenticated;
GRANT ALL ON public.clan_join_requests TO service_role;
ALTER TABLE public.clan_join_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own join requests readable" ON public.clan_join_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE TABLE public.clan_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id uuid NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT clan_messages_len CHECK (char_length(content) BETWEEN 1 AND 500)
);
CREATE INDEX clan_messages_clan_created_idx ON public.clan_messages (clan_id, created_at DESC);
GRANT SELECT ON public.clan_messages TO authenticated;
GRANT ALL ON public.clan_messages TO service_role;
ALTER TABLE public.clan_messages ENABLE ROW LEVEL SECURITY;
-- No direct read policy; access via RPC only.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS clan_id uuid;

-- Helpers
CREATE OR REPLACE FUNCTION public.my_clan_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT clan_id FROM public.clan_members WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.my_clan_role()
RETURNS public.clan_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.clan_members WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.create_clan(p_tag text, p_name text, p_description text DEFAULT '')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_tag text := trim(coalesce(p_tag, ''));
  v_name text := trim(coalesce(p_name, ''));
  v_desc text := coalesce(p_description, '');
  v_id uuid;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  IF char_length(v_tag) < 2 OR char_length(v_tag) > 5 THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_tag'); END IF;
  IF v_tag !~ '^[A-Za-z0-9]+$' THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_tag_chars'); END IF;
  IF char_length(v_name) < 3 OR char_length(v_name) > 24 THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_name'); END IF;
  IF char_length(v_desc) > 240 THEN RETURN jsonb_build_object('ok', false, 'error', 'desc_too_long'); END IF;
  IF EXISTS (SELECT 1 FROM public.clan_members WHERE user_id = v_user) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_in_clan');
  END IF;
  IF EXISTS (SELECT 1 FROM public.clans WHERE lower(tag) = lower(v_tag)) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'tag_taken');
  END IF;
  IF EXISTS (SELECT 1 FROM public.clans WHERE lower(name) = lower(v_name)) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'name_taken');
  END IF;

  INSERT INTO public.clans (tag, name, description, leader_id, member_count)
    VALUES (v_tag, v_name, v_desc, v_user, 1)
    RETURNING id INTO v_id;
  INSERT INTO public.clan_members (clan_id, user_id, role) VALUES (v_id, v_user, 'leader');
  UPDATE public.profiles SET clan_id = v_id, updated_at = now() WHERE user_id = v_user;
  RETURN jsonb_build_object('ok', true, 'clan_id', v_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.request_join_clan(p_clan_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  IF EXISTS (SELECT 1 FROM public.clan_members WHERE user_id = v_user) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_in_clan');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.clans WHERE id = p_clan_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;
  INSERT INTO public.clan_join_requests (clan_id, user_id) VALUES (p_clan_id, v_user)
    ON CONFLICT DO NOTHING;
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_join_request(p_clan_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  DELETE FROM public.clan_join_requests WHERE clan_id = p_clan_id AND user_id = v_user;
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.respond_join_request(p_user_id uuid, p_accept boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_clan uuid;
  v_role public.clan_role;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  SELECT clan_id, role INTO v_clan, v_role FROM public.clan_members WHERE user_id = v_user;
  IF v_clan IS NULL OR v_role = 'member' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.clan_join_requests WHERE clan_id = v_clan AND user_id = p_user_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;
  DELETE FROM public.clan_join_requests WHERE clan_id = v_clan AND user_id = p_user_id;
  IF p_accept THEN
    IF EXISTS (SELECT 1 FROM public.clan_members WHERE user_id = p_user_id) THEN
      RETURN jsonb_build_object('ok', false, 'error', 'user_in_clan');
    END IF;
    INSERT INTO public.clan_members (clan_id, user_id, role) VALUES (v_clan, p_user_id, 'member');
    UPDATE public.clans SET member_count = member_count + 1, updated_at = now() WHERE id = v_clan;
    UPDATE public.profiles SET clan_id = v_clan, updated_at = now() WHERE user_id = p_user_id;
  END IF;
  RETURN jsonb_build_object('ok', true, 'accepted', p_accept);
END;
$$;

CREATE OR REPLACE FUNCTION public.leave_clan()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_clan uuid; v_role public.clan_role;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  SELECT clan_id, role INTO v_clan, v_role FROM public.clan_members WHERE user_id = v_user;
  IF v_clan IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'not_in_clan'); END IF;
  IF v_role = 'leader' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'leader_must_transfer_or_disband');
  END IF;
  DELETE FROM public.clan_members WHERE clan_id = v_clan AND user_id = v_user;
  UPDATE public.clans SET member_count = GREATEST(0, member_count - 1), updated_at = now() WHERE id = v_clan;
  UPDATE public.profiles SET clan_id = NULL, updated_at = now() WHERE user_id = v_user;
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.kick_clan_member(p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_clan uuid; v_role public.clan_role;
  v_target public.clan_role;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  IF p_user_id = v_user THEN RETURN jsonb_build_object('ok', false, 'error', 'cannot_kick_self'); END IF;
  SELECT clan_id, role INTO v_clan, v_role FROM public.clan_members WHERE user_id = v_user;
  IF v_clan IS NULL OR v_role = 'member' THEN RETURN jsonb_build_object('ok', false, 'error', 'forbidden'); END IF;
  SELECT role INTO v_target FROM public.clan_members WHERE clan_id = v_clan AND user_id = p_user_id;
  IF v_target IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'not_member'); END IF;
  IF v_target = 'leader' THEN RETURN jsonb_build_object('ok', false, 'error', 'cannot_kick_leader'); END IF;
  IF v_role = 'officer' AND v_target = 'officer' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;
  DELETE FROM public.clan_members WHERE clan_id = v_clan AND user_id = p_user_id;
  UPDATE public.clans SET member_count = GREATEST(0, member_count - 1), updated_at = now() WHERE id = v_clan;
  UPDATE public.profiles SET clan_id = NULL, updated_at = now() WHERE user_id = p_user_id;
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.set_clan_member_role(p_user_id uuid, p_role public.clan_role)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_clan uuid; v_role public.clan_role;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  SELECT clan_id, role INTO v_clan, v_role FROM public.clan_members WHERE user_id = v_user;
  IF v_clan IS NULL OR v_role <> 'leader' THEN RETURN jsonb_build_object('ok', false, 'error', 'forbidden'); END IF;
  IF p_role = 'leader' THEN RETURN jsonb_build_object('ok', false, 'error', 'use_transfer_leadership'); END IF;
  IF NOT EXISTS (SELECT 1 FROM public.clan_members WHERE clan_id = v_clan AND user_id = p_user_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_member');
  END IF;
  UPDATE public.clan_members SET role = p_role WHERE clan_id = v_clan AND user_id = p_user_id;
  RETURN jsonb_build_object('ok', true, 'role', p_role);
END;
$$;

CREATE OR REPLACE FUNCTION public.transfer_clan_leadership(p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_clan uuid; v_role public.clan_role;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  IF p_user_id = v_user THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_target'); END IF;
  SELECT clan_id, role INTO v_clan, v_role FROM public.clan_members WHERE user_id = v_user;
  IF v_clan IS NULL OR v_role <> 'leader' THEN RETURN jsonb_build_object('ok', false, 'error', 'forbidden'); END IF;
  IF NOT EXISTS (SELECT 1 FROM public.clan_members WHERE clan_id = v_clan AND user_id = p_user_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_member');
  END IF;
  UPDATE public.clan_members SET role = 'member' WHERE clan_id = v_clan AND user_id = v_user;
  UPDATE public.clan_members SET role = 'leader' WHERE clan_id = v_clan AND user_id = p_user_id;
  UPDATE public.clans SET leader_id = p_user_id, updated_at = now() WHERE id = v_clan;
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.disband_clan()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_clan uuid; v_role public.clan_role;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  SELECT clan_id, role INTO v_clan, v_role FROM public.clan_members WHERE user_id = v_user;
  IF v_clan IS NULL OR v_role <> 'leader' THEN RETURN jsonb_build_object('ok', false, 'error', 'forbidden'); END IF;
  UPDATE public.profiles SET clan_id = NULL, updated_at = now()
    WHERE user_id IN (SELECT user_id FROM public.clan_members WHERE clan_id = v_clan);
  DELETE FROM public.clans WHERE id = v_clan;
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_clan_description(p_description text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_clan uuid; v_role public.clan_role;
  v_desc text := coalesce(p_description, '');
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  IF char_length(v_desc) > 240 THEN RETURN jsonb_build_object('ok', false, 'error', 'desc_too_long'); END IF;
  SELECT clan_id, role INTO v_clan, v_role FROM public.clan_members WHERE user_id = v_user;
  IF v_clan IS NULL OR v_role = 'member' THEN RETURN jsonb_build_object('ok', false, 'error', 'forbidden'); END IF;
  UPDATE public.clans SET description = v_desc, updated_at = now() WHERE id = v_clan;
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.send_clan_message(p_content text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_clan uuid;
  v_c text := trim(coalesce(p_content, ''));
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  IF char_length(v_c) < 1 OR char_length(v_c) > 500 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_length');
  END IF;
  SELECT clan_id INTO v_clan FROM public.clan_members WHERE user_id = v_user;
  IF v_clan IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'not_in_clan'); END IF;
  INSERT INTO public.clan_messages (clan_id, user_id, content) VALUES (v_clan, v_user, v_c);
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_clan_messages(p_limit integer DEFAULT 100)
RETURNS TABLE(id uuid, user_id uuid, username text, username_color text, avatar_character_id text, content text, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_clan uuid;
BEGIN
  IF v_user IS NULL THEN RETURN; END IF;
  SELECT clan_id INTO v_clan FROM public.clan_members WHERE user_id = v_user;
  IF v_clan IS NULL THEN RETURN; END IF;
  RETURN QUERY
    SELECT m.id, m.user_id, p.username, p.username_color, p.avatar_character_id, m.content, m.created_at
    FROM public.clan_messages m
    LEFT JOIN public.profiles p ON p.user_id = m.user_id
    WHERE m.clan_id = v_clan
    ORDER BY m.created_at DESC
    LIMIT GREATEST(1, LEAST(500, p_limit));
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_clan()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_clan uuid;
  v_role public.clan_role;
  v_details jsonb;
  v_members jsonb;
  v_requests jsonb;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  SELECT clan_id, role INTO v_clan, v_role FROM public.clan_members WHERE user_id = v_user;
  IF v_clan IS NULL THEN RETURN jsonb_build_object('ok', true, 'in_clan', false); END IF;
  SELECT to_jsonb(c) INTO v_details FROM public.clans c WHERE id = v_clan;
  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.role_rank, t.username), '[]'::jsonb) INTO v_members FROM (
    SELECT cm.user_id, cm.role,
      CASE cm.role WHEN 'leader' THEN 0 WHEN 'officer' THEN 1 ELSE 2 END AS role_rank,
      p.username, p.username_color, p.title, p.avatar_character_id, p.profile_frame,
      COALESCE(pl.level, 1) AS level,
      COALESCE(rs.rating, 1000) AS rival_rating,
      cm.joined_at
    FROM public.clan_members cm
    LEFT JOIN public.profiles p ON p.user_id = cm.user_id
    LEFT JOIN public.player_levels pl ON pl.user_id = cm.user_id
    LEFT JOIN public.rival_stats rs ON rs.user_id = cm.user_id
    WHERE cm.clan_id = v_clan
  ) t;

  IF v_role IN ('leader','officer') THEN
    SELECT COALESCE(jsonb_agg(row_to_json(r) ORDER BY r.created_at ASC), '[]'::jsonb) INTO v_requests FROM (
      SELECT jr.user_id, jr.created_at,
        p.username, p.username_color, p.title, p.avatar_character_id, p.profile_frame,
        COALESCE(pl.level, 1) AS level
      FROM public.clan_join_requests jr
      LEFT JOIN public.profiles p ON p.user_id = jr.user_id
      LEFT JOIN public.player_levels pl ON pl.user_id = jr.user_id
      WHERE jr.clan_id = v_clan
    ) r;
  ELSE
    v_requests := '[]'::jsonb;
  END IF;

  RETURN jsonb_build_object('ok', true, 'in_clan', true,
    'my_role', v_role, 'clan', v_details, 'members', v_members, 'requests', v_requests);
END;
$$;

CREATE OR REPLACE FUNCTION public.list_clans(p_query text DEFAULT '', p_limit integer DEFAULT 50)
RETURNS TABLE(id uuid, tag text, name text, description text, member_count integer, total_level bigint, created_at timestamptz, my_request boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.tag, c.name, c.description, c.member_count,
    COALESCE(SUM(pl.level), 0)::bigint AS total_level,
    c.created_at,
    EXISTS(SELECT 1 FROM public.clan_join_requests jr WHERE jr.clan_id = c.id AND jr.user_id = auth.uid()) AS my_request
  FROM public.clans c
  LEFT JOIN public.clan_members cm ON cm.clan_id = c.id
  LEFT JOIN public.player_levels pl ON pl.user_id = cm.user_id
  WHERE (
    p_query = '' OR lower(c.name) LIKE '%' || lower(trim(p_query)) || '%'
     OR lower(c.tag) LIKE lower(trim(p_query)) || '%'
  )
  GROUP BY c.id
  ORDER BY c.member_count DESC, total_level DESC, c.created_at ASC
  LIMIT GREATEST(1, LEAST(200, p_limit));
$$;

CREATE OR REPLACE FUNCTION public.get_clan_leaderboard(p_limit integer DEFAULT 100)
RETURNS TABLE(rank bigint, id uuid, tag text, name text, member_count integer, total_level bigint, total_rating bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH agg AS (
    SELECT c.id, c.tag, c.name, c.member_count,
      COALESCE(SUM(pl.level), 0)::bigint AS total_level,
      COALESCE(SUM(rs.rating), 0)::bigint AS total_rating
    FROM public.clans c
    LEFT JOIN public.clan_members cm ON cm.clan_id = c.id
    LEFT JOIN public.player_levels pl ON pl.user_id = cm.user_id
    LEFT JOIN public.rival_stats rs ON rs.user_id = cm.user_id
    GROUP BY c.id
  )
  SELECT RANK() OVER (ORDER BY total_level DESC, total_rating DESC) AS rank,
    id, tag, name, member_count, total_level, total_rating
  FROM agg
  ORDER BY total_level DESC, total_rating DESC
  LIMIT GREATEST(1, LEAST(500, p_limit));
$$;
