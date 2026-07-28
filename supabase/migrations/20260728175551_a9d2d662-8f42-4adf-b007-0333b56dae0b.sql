
CREATE TYPE public.friend_status AS ENUM ('pending', 'accepted');

CREATE TABLE public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL,
  addressee_id uuid NOT NULL,
  status public.friend_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT no_self_friend CHECK (requester_id <> addressee_id),
  CONSTRAINT unique_pair UNIQUE (requester_id, addressee_id)
);

CREATE INDEX friendships_requester_idx ON public.friendships (requester_id, status);
CREATE INDEX friendships_addressee_idx ON public.friendships (addressee_id, status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.friendships TO authenticated;
GRANT ALL ON public.friendships TO service_role;

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own friendships readable" ON public.friendships
  FOR SELECT TO authenticated
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());

-- Writes go through security-definer RPCs; no direct policies for insert/update/delete.

CREATE OR REPLACE FUNCTION public.send_friend_request(p_addressee uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_existing public.friendships%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  IF p_addressee IS NULL OR p_addressee = v_user THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_target');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = p_addressee AND username IS NOT NULL) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  SELECT * INTO v_existing FROM public.friendships
    WHERE (requester_id = v_user AND addressee_id = p_addressee)
       OR (requester_id = p_addressee AND addressee_id = v_user)
    LIMIT 1;

  IF v_existing.id IS NOT NULL THEN
    IF v_existing.status = 'accepted' THEN
      RETURN jsonb_build_object('ok', false, 'error', 'already_friends');
    END IF;
    -- pending: if the other side sent it, auto-accept
    IF v_existing.requester_id = p_addressee AND v_existing.addressee_id = v_user THEN
      UPDATE public.friendships SET status = 'accepted', updated_at = now() WHERE id = v_existing.id;
      RETURN jsonb_build_object('ok', true, 'status', 'accepted');
    END IF;
    RETURN jsonb_build_object('ok', false, 'error', 'already_requested');
  END IF;

  INSERT INTO public.friendships (requester_id, addressee_id, status)
    VALUES (v_user, p_addressee, 'pending');
  RETURN jsonb_build_object('ok', true, 'status', 'pending');
END;
$$;

CREATE OR REPLACE FUNCTION public.respond_friend_request(p_request_id uuid, p_accept boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_row public.friendships%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  SELECT * INTO v_row FROM public.friendships WHERE id = p_request_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'not_found'); END IF;
  IF v_row.addressee_id <> v_user THEN RETURN jsonb_build_object('ok', false, 'error', 'forbidden'); END IF;
  IF v_row.status <> 'pending' THEN RETURN jsonb_build_object('ok', false, 'error', 'not_pending'); END IF;

  IF p_accept THEN
    UPDATE public.friendships SET status = 'accepted', updated_at = now() WHERE id = p_request_id;
    RETURN jsonb_build_object('ok', true, 'status', 'accepted');
  ELSE
    DELETE FROM public.friendships WHERE id = p_request_id;
    RETURN jsonb_build_object('ok', true, 'status', 'rejected');
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_friend(p_other uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  DELETE FROM public.friendships
    WHERE (requester_id = v_user AND addressee_id = p_other)
       OR (requester_id = p_other AND addressee_id = v_user);
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_friends()
RETURNS TABLE(
  user_id uuid, username text, title text, username_color text,
  avatar_character_id text, profile_frame text, level integer,
  rival_rating integer, friended_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    CASE WHEN f.requester_id = auth.uid() THEN f.addressee_id ELSE f.requester_id END AS user_id,
    p.username, p.title, p.username_color, p.avatar_character_id, p.profile_frame,
    COALESCE(pl.level, 1), COALESCE(rs.rating, 1000), f.updated_at
  FROM public.friendships f
  JOIN public.profiles p ON p.user_id = CASE WHEN f.requester_id = auth.uid() THEN f.addressee_id ELSE f.requester_id END
  LEFT JOIN public.player_levels pl ON pl.user_id = p.user_id
  LEFT JOIN public.rival_stats rs ON rs.user_id = p.user_id
  WHERE f.status = 'accepted'
    AND (f.requester_id = auth.uid() OR f.addressee_id = auth.uid())
  ORDER BY p.username ASC;
$$;

CREATE OR REPLACE FUNCTION public.get_my_friend_requests()
RETURNS TABLE(
  id uuid, direction text, user_id uuid, username text,
  title text, username_color text, avatar_character_id text,
  profile_frame text, created_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    f.id,
    CASE WHEN f.requester_id = auth.uid() THEN 'outgoing' ELSE 'incoming' END,
    CASE WHEN f.requester_id = auth.uid() THEN f.addressee_id ELSE f.requester_id END,
    p.username, p.title, p.username_color, p.avatar_character_id, p.profile_frame,
    f.created_at
  FROM public.friendships f
  JOIN public.profiles p ON p.user_id = CASE WHEN f.requester_id = auth.uid() THEN f.addressee_id ELSE f.requester_id END
  WHERE f.status = 'pending'
    AND (f.requester_id = auth.uid() OR f.addressee_id = auth.uid())
  ORDER BY f.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_friend_status(p_other uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_row public.friendships%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('state', 'none'); END IF;
  IF p_other = v_user THEN RETURN jsonb_build_object('state', 'self'); END IF;
  SELECT * INTO v_row FROM public.friendships
    WHERE (requester_id = v_user AND addressee_id = p_other)
       OR (requester_id = p_other AND addressee_id = v_user)
    LIMIT 1;
  IF NOT FOUND THEN RETURN jsonb_build_object('state', 'none'); END IF;
  IF v_row.status = 'accepted' THEN RETURN jsonb_build_object('state', 'friends', 'id', v_row.id); END IF;
  IF v_row.requester_id = v_user THEN RETURN jsonb_build_object('state', 'outgoing', 'id', v_row.id); END IF;
  RETURN jsonb_build_object('state', 'incoming', 'id', v_row.id);
END;
$$;

CREATE OR REPLACE FUNCTION public.search_users(p_query text, p_limit integer DEFAULT 20)
RETURNS TABLE(
  user_id uuid, username text, title text, username_color text,
  avatar_character_id text, profile_frame text, level integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.username, p.title, p.username_color,
    p.avatar_character_id, p.profile_frame, COALESCE(pl.level, 1)
  FROM public.profiles p
  LEFT JOIN public.player_levels pl ON pl.user_id = p.user_id
  WHERE p.username IS NOT NULL
    AND auth.uid() IS NOT NULL
    AND p.user_id <> auth.uid()
    AND lower(p.username) LIKE lower(trim(p_query)) || '%'
  ORDER BY p.username ASC
  LIMIT GREATEST(1, LEAST(50, p_limit));
$$;
