
-- Daily puzzle assignments (shared by all players)
CREATE TABLE public.bleachdle_daily (
  day_key TEXT PRIMARY KEY,
  puzzle_number INT NOT NULL,
  character_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bleachdle_daily TO authenticated;
GRANT ALL ON public.bleachdle_daily TO service_role;
ALTER TABLE public.bleachdle_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bleachdle_daily readable by authenticated" ON public.bleachdle_daily
  FOR SELECT TO authenticated USING (true);

-- Per-user solve log (one row per user per day at most)
CREATE TABLE public.bleachdle_solves (
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  day_key TEXT NOT NULL,
  guesses INT NOT NULL,
  won BOOLEAN NOT NULL,
  solved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  souls_awarded INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day_key)
);
GRANT SELECT ON public.bleachdle_solves TO authenticated;
GRANT ALL ON public.bleachdle_solves TO service_role;
ALTER TABLE public.bleachdle_solves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own bleachdle solves readable" ON public.bleachdle_solves
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Per-user aggregate stats
CREATE TABLE public.bleachdle_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  games_played INT NOT NULL DEFAULT 0,
  games_won INT NOT NULL DEFAULT 0,
  current_streak INT NOT NULL DEFAULT 0,
  best_streak INT NOT NULL DEFAULT 0,
  total_guesses INT NOT NULL DEFAULT 0,
  fastest_solve INT,
  last_played_day TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bleachdle_stats TO authenticated;
GRANT ALL ON public.bleachdle_stats TO service_role;
ALTER TABLE public.bleachdle_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own bleachdle stats readable" ON public.bleachdle_stats
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Fetch or assign today's puzzle. Client supplies the full list of playable
-- character ids so the answer is always drawn from the live in-app roster.
CREATE OR REPLACE FUNCTION public.get_bleachdle_today(p_candidates TEXT[])
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_day TEXT := public.current_day_key();
  v_row public.bleachdle_daily%ROWTYPE;
  v_recent TEXT[];
  v_pool TEXT[];
  v_pick TEXT;
  v_num INT;
  v_solve public.bleachdle_solves%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated');
  END IF;
  IF p_candidates IS NULL OR array_length(p_candidates, 1) IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_candidates');
  END IF;

  SELECT * INTO v_row FROM public.bleachdle_daily WHERE day_key = v_day;

  IF v_row.day_key IS NULL THEN
    -- Recent 30-day exclusion
    SELECT COALESCE(array_agg(character_id), ARRAY[]::text[]) INTO v_recent
      FROM public.bleachdle_daily
      WHERE day_key >= to_char((now() AT TIME ZONE 'UTC')::date - 30, 'YYYY-MM-DD');

    SELECT ARRAY(
      SELECT c FROM unnest(p_candidates) c WHERE c <> ALL(v_recent)
    ) INTO v_pool;

    IF v_pool IS NULL OR array_length(v_pool, 1) IS NULL THEN
      v_pool := p_candidates;
    END IF;

    v_pick := v_pool[1 + floor(random() * array_length(v_pool, 1))::int];
    SELECT COALESCE(MAX(puzzle_number), 0) + 1 INTO v_num FROM public.bleachdle_daily;

    INSERT INTO public.bleachdle_daily (day_key, puzzle_number, character_id)
    VALUES (v_day, v_num, v_pick)
    ON CONFLICT (day_key) DO NOTHING
    RETURNING * INTO v_row;

    IF v_row.day_key IS NULL THEN
      SELECT * INTO v_row FROM public.bleachdle_daily WHERE day_key = v_day;
    END IF;
  END IF;

  SELECT * INTO v_solve FROM public.bleachdle_solves
    WHERE user_id = v_user AND day_key = v_day;

  RETURN jsonb_build_object(
    'ok', true,
    'day_key', v_row.day_key,
    'puzzle_number', v_row.puzzle_number,
    'character_id', v_row.character_id,
    'already_solved', v_solve.user_id IS NOT NULL,
    'previous_guesses', COALESCE(v_solve.guesses, 0),
    'previous_won', COALESCE(v_solve.won, false)
  );
END;
$$;

-- Submit a solve. Awards souls only on the first successful solve of the day.
CREATE OR REPLACE FUNCTION public.submit_bleachdle(p_day TEXT, p_guesses INT, p_won BOOLEAN)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_existing public.bleachdle_solves%ROWTYPE;
  v_stats public.bleachdle_stats%ROWTYPE;
  v_daily public.bleachdle_daily%ROWTYPE;
  v_souls INT := 0;
  v_yesterday TEXT;
  v_new_streak INT;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  IF p_day IS NULL OR p_guesses IS NULL OR p_guesses < 1 OR p_guesses > 6 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_input');
  END IF;

  SELECT * INTO v_daily FROM public.bleachdle_daily WHERE day_key = p_day;
  IF v_daily.day_key IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_puzzle');
  END IF;

  SELECT * INTO v_existing FROM public.bleachdle_solves
    WHERE user_id = v_user AND day_key = p_day;

  IF v_existing.user_id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'already_solved', true,
      'souls_awarded', 0, 'guesses', v_existing.guesses, 'won', v_existing.won);
  END IF;

  IF p_won THEN
    v_souls := 25;
    UPDATE public.profiles SET souls = COALESCE(souls, 0) + v_souls, updated_at = now()
      WHERE user_id = v_user;
  END IF;

  INSERT INTO public.bleachdle_solves (user_id, day_key, guesses, won, souls_awarded)
    VALUES (v_user, p_day, p_guesses, p_won, v_souls);

  SELECT * INTO v_stats FROM public.bleachdle_stats WHERE user_id = v_user;

  v_yesterday := to_char((p_day::date) - 1, 'YYYY-MM-DD');
  IF p_won THEN
    IF v_stats.user_id IS NOT NULL AND v_stats.last_played_day = v_yesterday AND v_stats.current_streak > 0 THEN
      v_new_streak := v_stats.current_streak + 1;
    ELSE
      v_new_streak := 1;
    END IF;
  ELSE
    v_new_streak := 0;
  END IF;

  INSERT INTO public.bleachdle_stats
    (user_id, games_played, games_won, current_streak, best_streak, total_guesses, fastest_solve, last_played_day, updated_at)
  VALUES
    (v_user, 1, CASE WHEN p_won THEN 1 ELSE 0 END, v_new_streak, v_new_streak,
     p_guesses, CASE WHEN p_won THEN p_guesses ELSE NULL END, p_day, now())
  ON CONFLICT (user_id) DO UPDATE SET
    games_played = public.bleachdle_stats.games_played + 1,
    games_won = public.bleachdle_stats.games_won + CASE WHEN p_won THEN 1 ELSE 0 END,
    current_streak = v_new_streak,
    best_streak = GREATEST(public.bleachdle_stats.best_streak, v_new_streak),
    total_guesses = public.bleachdle_stats.total_guesses + p_guesses,
    fastest_solve = CASE
      WHEN p_won AND (public.bleachdle_stats.fastest_solve IS NULL OR p_guesses < public.bleachdle_stats.fastest_solve)
        THEN p_guesses ELSE public.bleachdle_stats.fastest_solve END,
    last_played_day = p_day,
    updated_at = now();

  RETURN jsonb_build_object('ok', true, 'already_solved', false,
    'souls_awarded', v_souls, 'guesses', p_guesses, 'won', p_won,
    'current_streak', v_new_streak);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_bleachdle_stats()
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_s public.bleachdle_stats%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  SELECT * INTO v_s FROM public.bleachdle_stats WHERE user_id = v_user;
  IF v_s.user_id IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'games_played', 0, 'games_won', 0,
      'current_streak', 0, 'best_streak', 0, 'avg_guesses', null,
      'fastest_solve', null, 'last_played_day', null);
  END IF;
  RETURN jsonb_build_object('ok', true,
    'games_played', v_s.games_played,
    'games_won', v_s.games_won,
    'current_streak', v_s.current_streak,
    'best_streak', v_s.best_streak,
    'avg_guesses', CASE WHEN v_s.games_played > 0
      THEN round((v_s.total_guesses::numeric / v_s.games_played)::numeric, 2) ELSE NULL END,
    'fastest_solve', v_s.fastest_solve,
    'last_played_day', v_s.last_played_day);
END;
$$;
