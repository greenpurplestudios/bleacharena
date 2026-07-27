CREATE TABLE public.mission_defs (
  id text PRIMARY KEY,
  target int NOT NULL,
  reward_souls int NOT NULL,
  sort_order int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.mission_defs TO authenticated;
GRANT ALL ON public.mission_defs TO service_role;
ALTER TABLE public.mission_defs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mission defs readable" ON public.mission_defs FOR SELECT TO authenticated USING (true);

INSERT INTO public.mission_defs (id, target, reward_souls, sort_order) VALUES
  ('draft_play', 1, 20, 1),
  ('pack_open', 2, 30, 2),
  ('rival_win', 1, 40, 3),
  ('quiz_correct', 3, 25, 4);

CREATE TABLE public.user_mission_progress (
  user_id uuid NOT NULL,
  day_key text NOT NULL,
  mission_id text NOT NULL,
  progress int NOT NULL DEFAULT 0,
  claimed boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, day_key, mission_id)
);
GRANT SELECT ON public.user_mission_progress TO authenticated;
GRANT ALL ON public.user_mission_progress TO service_role;
ALTER TABLE public.user_mission_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own progress readable" ON public.user_mission_progress FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.current_day_key()
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD');
$$;

CREATE OR REPLACE FUNCTION public.get_my_missions()
RETURNS TABLE(mission_id text, target int, reward_souls int, progress int, claimed boolean, sort_order int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT d.id, d.target, d.reward_souls,
    COALESCE(p.progress, 0)::int,
    COALESCE(p.claimed, false),
    d.sort_order
  FROM public.mission_defs d
  LEFT JOIN public.user_mission_progress p
    ON p.mission_id = d.id AND p.user_id = auth.uid() AND p.day_key = public.current_day_key()
  ORDER BY d.sort_order;
$$;

CREATE OR REPLACE FUNCTION public.track_mission(p_mission_id text, p_increment int DEFAULT 1)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_day text := public.current_day_key();
  v_target int;
  v_progress int;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  SELECT target INTO v_target FROM public.mission_defs WHERE id = p_mission_id;
  IF v_target IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_mission'); END IF;

  INSERT INTO public.user_mission_progress (user_id, day_key, mission_id, progress)
  VALUES (v_user, v_day, p_mission_id, LEAST(v_target, GREATEST(0, p_increment)))
  ON CONFLICT (user_id, day_key, mission_id) DO UPDATE
    SET progress = LEAST(v_target, public.user_mission_progress.progress + GREATEST(0, p_increment)),
        updated_at = now()
  RETURNING progress INTO v_progress;

  RETURN jsonb_build_object('ok', true, 'progress', v_progress, 'target', v_target);
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_mission(p_mission_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_day text := public.current_day_key();
  v_target int;
  v_reward int;
  v_progress int;
  v_claimed boolean;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  SELECT target, reward_souls INTO v_target, v_reward FROM public.mission_defs WHERE id = p_mission_id;
  IF v_target IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_mission'); END IF;

  SELECT progress, claimed INTO v_progress, v_claimed
  FROM public.user_mission_progress
  WHERE user_id = v_user AND day_key = v_day AND mission_id = p_mission_id;

  IF v_progress IS NULL OR v_progress < v_target THEN
    RETURN jsonb_build_object('ok', false, 'error', 'incomplete');
  END IF;
  IF COALESCE(v_claimed, false) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_claimed');
  END IF;

  UPDATE public.user_mission_progress SET claimed = true, updated_at = now()
    WHERE user_id = v_user AND day_key = v_day AND mission_id = p_mission_id;

  UPDATE public.profiles SET souls = COALESCE(souls, 0) + v_reward, updated_at = now()
    WHERE user_id = v_user;

  RETURN jsonb_build_object('ok', true, 'souls_awarded', v_reward);
END;
$$;