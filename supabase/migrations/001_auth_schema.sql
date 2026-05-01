-- ============================================================
-- 001_auth_schema.sql
-- Run this in Supabase SQL Editor (once, in order)
-- ============================================================

-- 1. profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id              uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           text,
  display_name    text,
  avatar_url      text,
  role            text        DEFAULT 'student',
  account_weight  integer     DEFAULT 0,
  teacher_status  text        DEFAULT 'none',
  bio             text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- 2. wallets
CREATE TABLE IF NOT EXISTS public.wallets (
  user_id      uuid    PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  free_tokens  integer DEFAULT 100,
  paid_tokens  integer DEFAULT 0,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- 3. wallet_transactions
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  token_type    text,
  amount        integer,
  reason        text,
  related_type  text,
  related_id    uuid,
  created_at    timestamptz DEFAULT now()
);

-- 4. Auto-create profile + wallet on new signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'student')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.wallets (user_id, free_tokens, paid_tokens)
  VALUES (new.id, 100, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$;

-- 5. Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Row Level Security
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- profiles policies
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- wallets policies
CREATE POLICY "Users can read own wallet"
  ON public.wallets FOR SELECT
  USING (auth.uid() = user_id);

-- wallet_transactions policies
CREATE POLICY "Users can read own transactions"
  ON public.wallet_transactions FOR SELECT
  USING (auth.uid() = user_id);
