
-- Profiles table
CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX profiles_username_lower_idx ON public.profiles (lower(username)) WHERE username IS NOT NULL;

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are readable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Leaderboard scores
CREATE TABLE public.leaderboard_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  season_key text NOT NULL,
  score numeric(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, season_key)
);

CREATE INDEX leaderboard_scores_season_score_idx ON public.leaderboard_scores (season_key, score DESC);

GRANT SELECT ON public.leaderboard_scores TO authenticated;
GRANT ALL ON public.leaderboard_scores TO service_role;

ALTER TABLE public.leaderboard_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Scores readable by authenticated users"
  ON public.leaderboard_scores FOR SELECT
  TO authenticated
  USING (true);
-- writes go through SECURITY DEFINER RPC only

-- Auto-create profile on user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Current season key (ISO year-week)
CREATE OR REPLACE FUNCTION public.current_season_key()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT to_char(now() AT TIME ZONE 'UTC', 'IYYY"-W"IW');
$$;

-- Submit score: clamps 0-100, keeps best per week per user, requires username
CREATE OR REPLACE FUNCTION public.submit_score(p_score numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_season text := public.current_season_key();
  v_score numeric(5,2);
  v_existing numeric(5,2);
  v_username text;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated');
  END IF;

  IF p_score IS NULL OR p_score <> p_score THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_score');
  END IF;

  v_score := GREATEST(0, LEAST(100, p_score))::numeric(5,2);

  SELECT username INTO v_username FROM public.profiles WHERE user_id = v_user;
  IF v_username IS NULL OR length(trim(v_username)) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'needs_username', true);
  END IF;

  SELECT score INTO v_existing
  FROM public.leaderboard_scores
  WHERE user_id = v_user AND season_key = v_season;

  IF v_existing IS NULL THEN
    INSERT INTO public.leaderboard_scores (user_id, season_key, score)
    VALUES (v_user, v_season, v_score);
    RETURN jsonb_build_object('ok', true, 'score', v_score, 'improved', true, 'season', v_season);
  ELSIF v_score > v_existing THEN
    UPDATE public.leaderboard_scores
    SET score = v_score, submitted_at = now()
    WHERE user_id = v_user AND season_key = v_season;
    RETURN jsonb_build_object('ok', true, 'score', v_score, 'improved', true, 'season', v_season);
  ELSE
    RETURN jsonb_build_object('ok', true, 'score', v_existing, 'improved', false, 'season', v_season);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_score(numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_score(numeric) TO authenticated;

-- Set username with validation + uniqueness
CREATE OR REPLACE FUNCTION public.set_username(p_username text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_clean text;
  v_conflict uuid;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated');
  END IF;

  v_clean := trim(coalesce(p_username, ''));
  IF length(v_clean) < 2 OR length(v_clean) > 20 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_length');
  END IF;
  IF v_clean !~ '^[A-Za-z0-9_\-]+$' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_chars');
  END IF;

  SELECT user_id INTO v_conflict FROM public.profiles
    WHERE lower(username) = lower(v_clean) AND user_id <> v_user;
  IF v_conflict IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'taken');
  END IF;

  INSERT INTO public.profiles (user_id, username, updated_at)
  VALUES (v_user, v_clean, now())
  ON CONFLICT (user_id) DO UPDATE
    SET username = EXCLUDED.username, updated_at = now();

  RETURN jsonb_build_object('ok', true, 'username', v_clean);
END;
$$;

REVOKE ALL ON FUNCTION public.set_username(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_username(text) TO authenticated;

-- Leaderboard read
CREATE OR REPLACE FUNCTION public.get_leaderboard(p_season text DEFAULT NULL, p_limit int DEFAULT 100)
RETURNS TABLE (rank bigint, user_id uuid, username text, score numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH s AS (
    SELECT ls.user_id, ls.score
    FROM public.leaderboard_scores ls
    WHERE ls.season_key = COALESCE(p_season, public.current_season_key())
  )
  SELECT
    RANK() OVER (ORDER BY s.score DESC) AS rank,
    s.user_id,
    p.username,
    s.score
  FROM s
  JOIN public.profiles p ON p.user_id = s.user_id
  WHERE p.username IS NOT NULL
  ORDER BY s.score DESC, p.username ASC
  LIMIT GREATEST(1, LEAST(500, p_limit));
$$;

REVOKE ALL ON FUNCTION public.get_leaderboard(text, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(text, int) TO authenticated, anon;
