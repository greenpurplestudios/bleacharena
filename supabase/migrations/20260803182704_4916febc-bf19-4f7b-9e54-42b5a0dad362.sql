-- 1) Server time = Saudi Arabia (UTC+3)
CREATE OR REPLACE FUNCTION public.current_day_key()
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT to_char(now() AT TIME ZONE 'Asia/Riyadh', 'YYYY-MM-DD');
$$;

CREATE OR REPLACE FUNCTION public.current_season_key()
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT to_char(now() AT TIME ZONE 'Asia/Riyadh', 'IYYY"-W"IW');
$$;

CREATE OR REPLACE FUNCTION public.previous_season_key()
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT to_char((now() AT TIME ZONE 'Asia/Riyadh') - interval '7 days', 'IYYY"-W"IW');
$$;

-- 2) News
CREATE TABLE public.news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL DEFAULT 'update',
  title_en text NOT NULL,
  title_ar text NOT NULL,
  body_en text NOT NULL,
  body_ar text NOT NULL,
  dedupe_key text UNIQUE,
  pinned boolean NOT NULL DEFAULT false,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.news TO anon;
GRANT SELECT ON public.news TO authenticated;
GRANT ALL ON public.news TO service_role;

ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "news_read_all" ON public.news FOR SELECT USING (true);
CREATE POLICY "news_admin_write" ON public.news FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX news_published_idx ON public.news (pinned DESC, published_at DESC);

-- 3) Weekly winners announcement (idempotent per season)
CREATE OR REPLACE FUNCTION public.ensure_weekly_announcement()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_season text := public.previous_season_key();
  v_key text := 'weekly-' || v_season;
  v_en text;
  v_ar text;
  v_rows record;
  v_medals text[] := ARRAY['1st','2nd','3rd'];
  v_medals_ar text[] := ARRAY['الأول','الثاني','الثالث'];
  v_i int := 0;
BEGIN
  IF EXISTS (SELECT 1 FROM public.news WHERE dedupe_key = v_key) THEN RETURN; END IF;

  v_en := ''; v_ar := '';
  FOR v_rows IN
    SELECT p.username, ls.score
    FROM public.leaderboard_scores ls
    JOIN public.profiles p ON p.user_id = ls.user_id
    WHERE ls.season_key = v_season AND p.username IS NOT NULL
    ORDER BY ls.score DESC, p.username ASC
    LIMIT 3
  LOOP
    v_i := v_i + 1;
    v_en := v_en || v_medals[v_i] || ' — ' || v_rows.username || ' · ' || to_char(v_rows.score, 'FM999990.0') || E'\n';
    v_ar := v_ar || 'المركز ' || v_medals_ar[v_i] || ' — ' || v_rows.username || ' · ' || to_char(v_rows.score, 'FM999990.0') || E'\n';
  END LOOP;

  IF v_i = 0 THEN RETURN; END IF;

  INSERT INTO public.news (category, title_en, title_ar, body_en, body_ar, dedupe_key, published_at)
  VALUES (
    'leaderboard',
    'Weekly Leaderboard Results — ' || v_season,
    'نتائج لوحة الصدارة الأسبوعية — ' || v_season,
    'The season has reset! Congratulations to our top 3 souls:' || E'\n' || v_en,
    'انتهى الأسبوع! تهانينا لأفضل ٣ أرواح:' || E'\n' || v_ar,
    v_key,
    now()
  )
  ON CONFLICT (dedupe_key) DO NOTHING;
END; $$;

-- 4) Public news reader (generates the weekly announcement lazily)
CREATE OR REPLACE FUNCTION public.get_news(p_limit integer DEFAULT 20)
RETURNS TABLE(
  id uuid, category text, title_en text, title_ar text,
  body_en text, body_ar text, pinned boolean, published_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.ensure_weekly_announcement();
  RETURN QUERY
    SELECT n.id, n.category, n.title_en, n.title_ar, n.body_en, n.body_ar, n.pinned, n.published_at
    FROM public.news n
    ORDER BY n.pinned DESC, n.published_at DESC
    LIMIT GREATEST(1, LEAST(50, p_limit));
END; $$;

-- 5) Seed launch news
INSERT INTO public.news (category, title_en, title_ar, body_en, body_ar, dedupe_key, pinned, published_at) VALUES
('cosmetics','Collectible Nameplates have arrived','وصلت لوحات الأسماء القابلة للجمع',
 'Twenty new Nameplates now sit behind your name on the leaderboard, chat and profile. Six Element plates and fourteen Bleach plates — animated variants included. Find them in Urahara''s Shop, unlock them through level rewards, or earn them in limited events.',
 'عشرون لوحة اسم جديدة تظهر خلف اسمك في لوحة الصدارة والدردشة والملف الشخصي. ست لوحات للعناصر وأربع عشرة لوحة من عالم بليتش — بنسخ متحركة. اقتنِها من متجر أوراهارا، أو افتحها عبر مكافآت المستوى، أو اكسبها في الفعاليات المحدودة.',
 'seed-nameplates', true, now()),
('update','Server time is now Saudi Arabia (UTC+3)','توقيت الخادم أصبح توقيت السعودية (UTC+3)',
 'Every daily and weekly reset — daily login, missions, Bleachdle and the leaderboard season — now follows Saudi Arabia time.',
 'كل عمليات إعادة الضبط اليومية والأسبوعية — تسجيل الدخول اليومي والمهام وبليتشدل وموسم لوحة الصدارة — أصبحت تتبع توقيت السعودية.',
 'seed-server-time', false, now() - interval '1 hour'),
('soulduel','Soul Duel — development update','سول ديول — تحديث التطوير',
 'Strategic 5v5 battles across three random Bleach dimensions are in active development. Character abilities and the cinematic card battle system are being tuned now.',
 'معارك ٥ ضد ٥ الاستراتيجية عبر ثلاثة أبعاد عشوائية من عالم بليتش قيد التطوير. يجري الآن ضبط قدرات الشخصيات ونظام المعارك السينمائي.',
 'seed-soulduel', false, now() - interval '2 hours'),
('characters','Roster expansion','توسعة قائمة الشخصيات',
 'New souls joined the Arena, including Ukitake, Nemu, Bambietta, Bazz-B, Ikomikidomoe, Tosen, Szayelaporro and the mysterious Qais.',
 'انضمت أرواح جديدة إلى الساحة، منها أوكيتاكي ونيمو وبامبييتا وباز-بي وإيكوميكيدومو وتوسن وسزايل والغامض قيس.',
 'seed-roster', false, now() - interval '3 hours'),
('balance','Balance pass','تعديلات التوازن',
 'Ratings updated for Urahara, Ulquiorra, Starrk, Baraggan, Mayuri, Byakuya, Kirio, Kirinji and Shinji.',
 'تم تحديث تقييمات أوراهارا وأولكيورا وستارك وبراغان ومايوري وبياكويا وكيريو وكيرينجي وشينجي.',
 'seed-balance', false, now() - interval '4 hours');