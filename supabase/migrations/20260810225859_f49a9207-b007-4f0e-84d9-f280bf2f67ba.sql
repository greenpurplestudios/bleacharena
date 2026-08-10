
ALTER TABLE public.mission_defs
  ADD COLUMN IF NOT EXISTS event_key text,
  ADD COLUMN IF NOT EXISTS difficulty text NOT NULL DEFAULT 'easy',
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS name_en text,
  ADD COLUMN IF NOT EXISTS name_ar text;

UPDATE public.mission_defs SET event_key = id WHERE event_key IS NULL;

DELETE FROM public.mission_defs;

INSERT INTO public.mission_defs (id, event_key, target, reward_souls, sort_order, difficulty, name_en, name_ar) VALUES
  ('draft_play_1','draft_play',1,20,1,'easy','Complete a Draft','أكمل عملية اختيار'),
  ('draft_play_3','draft_play',3,55,2,'medium','Complete 3 Drafts','أكمل ٣ عمليات اختيار'),
  ('draft_play_5','draft_play',5,90,3,'hard','Complete 5 Drafts','أكمل ٥ عمليات اختيار'),
  ('pack_open_1','pack_open',1,15,4,'easy','Open a Pack','افتح حزمة'),
  ('pack_open_3','pack_open',3,35,5,'medium','Open 3 Packs','افتح ٣ حزم'),
  ('pack_open_6','pack_open',6,70,6,'hard','Open 6 Packs','افتح ٦ حزم'),
  ('rival_play_2','rival_play',2,30,7,'easy','Fight 2 Rival Battles','خض مبارزتين ضد المنافسين'),
  ('rival_win_1','rival_win',1,40,8,'medium','Win a Rival Battle','فز في مبارزة'),
  ('rival_win_3','rival_win',3,85,9,'hard','Win 3 Rival Battles','فز في ٣ مبارزات'),
  ('quiz_correct_3','quiz_correct',3,25,10,'easy','Answer 3 Quotes Correctly','أجب على ٣ اقتباسات بشكل صحيح'),
  ('quiz_correct_6','quiz_correct',6,50,11,'medium','Answer 6 Quotes Correctly','أجب على ٦ اقتباسات بشكل صحيح'),
  ('quiz_correct_10','quiz_correct',10,80,12,'hard','Answer 10 Quotes Correctly','أجب على ١٠ اقتباسات بشكل صحيح'),
  ('bleachdle_play_1','bleachdle_play',1,20,13,'easy','Play today''s Bleachdle','العب بليتشدل اليوم'),
  ('bleachdle_win_1','bleachdle_win',1,45,14,'medium','Solve today''s Bleachdle','احزر شخصية بليتشدل اليوم'),
  ('duel_play_1','duel_play',1,20,15,'easy','Play a Soul Duel','العب مبارزة أرواح'),
  ('duel_play_3','duel_play',3,55,16,'medium','Play 3 Soul Duels','العب ٣ مبارزات أرواح'),
  ('duel_win_1','duel_win',1,45,17,'medium','Win a Soul Duel','فز في مبارزة أرواح'),
  ('duel_win_2','duel_win',2,85,18,'hard','Win 2 Soul Duels','فز في مبارزتي أرواح'),
  ('duel_ultimate_1','duel_ultimate',1,35,19,'medium','Unleash an Ultimate Weapon','أطلق سلاحاً مطلقاً'),
  ('personality_quiz_1','personality_quiz',1,20,20,'easy','Take the Personality Quiz','اخض اختبار الشخصية'),
  ('login_claim_1','login_claim',1,15,21,'easy','Claim your daily login reward','احصل على مكافأة الدخول اليومية'),
  ('collect_new_1','collect_new',1,25,22,'easy','Add a new character to your Collection','أضف شخصية جديدة إلى مجموعتك'),
  ('collect_new_3','collect_new',3,60,23,'medium','Add 3 new characters to your Collection','أضف ٣ شخصيات جديدة إلى مجموعتك'),
  ('draft_rank_1','draft_rank',1,50,24,'medium','Finish a Draft with rank A or higher','أنه اختياراً بتقييم A أو أعلى'),
  ('draft_mythic_1','draft_mythic',1,45,25,'medium','Draft a Mythic character','اختر شخصية أسطورية نادرة'),
  ('pack_legendary_1','pack_legendary',1,60,26,'hard','Pull a Legendary or better from a pack','احصل على بطاقة أسطورية أو أفضل من حزمة');

CREATE TABLE IF NOT EXISTS public.user_daily_missions (
  user_id uuid NOT NULL,
  day_key text NOT NULL,
  mission_ids text[] NOT NULL,
  rerolls_used integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, day_key)
);

GRANT SELECT ON public.user_daily_missions TO authenticated;
GRANT ALL ON public.user_daily_missions TO service_role;
ALTER TABLE public.user_daily_missions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own daily missions" ON public.user_daily_missions;
CREATE POLICY "own daily missions" ON public.user_daily_missions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.ensure_daily_missions()
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_day text := public.current_day_key();
  v_ids text[];
BEGIN
  IF v_user IS NULL THEN RETURN ARRAY[]::text[]; END IF;

  SELECT mission_ids INTO v_ids FROM public.user_daily_missions
    WHERE user_id = v_user AND day_key = v_day;
  IF v_ids IS NOT NULL THEN RETURN v_ids; END IF;

  SELECT array_agg(id) INTO v_ids FROM (
    SELECT id FROM public.mission_defs WHERE active
    ORDER BY md5(id || v_day || v_user::text)
    LIMIT 4
  ) s;

  INSERT INTO public.user_daily_missions (user_id, day_key, mission_ids)
  VALUES (v_user, v_day, COALESCE(v_ids, ARRAY[]::text[]))
  ON CONFLICT (user_id, day_key) DO NOTHING;

  SELECT mission_ids INTO v_ids FROM public.user_daily_missions
    WHERE user_id = v_user AND day_key = v_day;
  RETURN COALESCE(v_ids, ARRAY[]::text[]);
END;
$$;

DROP FUNCTION IF EXISTS public.get_my_missions();
CREATE OR REPLACE FUNCTION public.get_my_missions()
RETURNS TABLE(
  mission_id text, target integer, reward_souls integer, progress integer,
  claimed boolean, sort_order integer, difficulty text,
  name_en text, name_ar text, event_key text, rerolls_left integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_day text := public.current_day_key();
  v_ids text[];
  v_rerolls int;
BEGIN
  IF v_user IS NULL THEN RETURN; END IF;
  v_ids := public.ensure_daily_missions();
  SELECT rerolls_used INTO v_rerolls FROM public.user_daily_missions
    WHERE user_id = v_user AND day_key = v_day;

  RETURN QUERY
  SELECT d.id, d.target, d.reward_souls,
         COALESCE(p.progress, 0)::int,
         COALESCE(p.claimed, false),
         idx::int,
         d.difficulty, d.name_en, d.name_ar, d.event_key,
         GREATEST(0, 1 - COALESCE(v_rerolls, 0))::int
  FROM unnest(v_ids) WITH ORDINALITY AS u(mid, idx)
  JOIN public.mission_defs d ON d.id = u.mid
  LEFT JOIN public.user_mission_progress p
    ON p.mission_id = d.id AND p.user_id = v_user AND p.day_key = v_day
  ORDER BY idx;
END;
$$;

DROP FUNCTION IF EXISTS public.track_mission(text, integer);
CREATE OR REPLACE FUNCTION public.track_mission(p_mission_id text, p_increment integer DEFAULT 1)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_day text := public.current_day_key();
  v_ids text[];
  r record;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  v_ids := public.ensure_daily_missions();

  FOR r IN
    SELECT d.id, d.target FROM public.mission_defs d
    WHERE d.id = ANY(v_ids) AND (d.event_key = p_mission_id OR d.id = p_mission_id)
  LOOP
    INSERT INTO public.user_mission_progress (user_id, day_key, mission_id, progress)
    VALUES (v_user, v_day, r.id, LEAST(r.target, GREATEST(0, p_increment)))
    ON CONFLICT (user_id, day_key, mission_id) DO UPDATE
      SET progress = LEAST(r.target, public.user_mission_progress.progress + GREATEST(0, p_increment)),
          updated_at = now();
  END LOOP;

  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.reroll_mission(p_mission_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_day text := public.current_day_key();
  v_ids text[];
  v_rerolls int;
  v_new text;
  v_claimed boolean;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  v_ids := public.ensure_daily_missions();
  SELECT rerolls_used INTO v_rerolls FROM public.user_daily_missions
    WHERE user_id = v_user AND day_key = v_day;
  IF COALESCE(v_rerolls, 0) >= 1 THEN RETURN jsonb_build_object('ok', false, 'error', 'no_rerolls'); END IF;
  IF NOT (p_mission_id = ANY(v_ids)) THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_mission'); END IF;

  SELECT claimed INTO v_claimed FROM public.user_mission_progress
    WHERE user_id = v_user AND day_key = v_day AND mission_id = p_mission_id;
  IF COALESCE(v_claimed, false) THEN RETURN jsonb_build_object('ok', false, 'error', 'already_claimed'); END IF;

  SELECT id INTO v_new FROM public.mission_defs
    WHERE active AND NOT (id = ANY(v_ids))
    ORDER BY random() LIMIT 1;
  IF v_new IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'no_missions'); END IF;

  UPDATE public.user_daily_missions
    SET mission_ids = array_replace(mission_ids, p_mission_id, v_new),
        rerolls_used = COALESCE(rerolls_used, 0) + 1
    WHERE user_id = v_user AND day_key = v_day;

  DELETE FROM public.user_mission_progress
    WHERE user_id = v_user AND day_key = v_day AND mission_id = p_mission_id;

  RETURN jsonb_build_object('ok', true, 'mission_id', v_new);
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_mission(p_mission_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_day text := public.current_day_key();
  v_target int;
  v_reward int;
  v_progress int;
  v_claimed boolean;
  v_ids text[];
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  v_ids := public.ensure_daily_missions();
  IF NOT (p_mission_id = ANY(v_ids)) THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_mission'); END IF;

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
