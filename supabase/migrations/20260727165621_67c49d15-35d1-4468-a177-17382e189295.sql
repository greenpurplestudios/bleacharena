
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS souls integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS username_color text,
  ADD COLUMN IF NOT EXISTS email text;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_idx
  ON public.profiles (lower(username))
  WHERE username IS NOT NULL;

-- Ensure profile row exists on signup (trigger handle_new_user already defined).
-- Attach trigger if missing.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;
