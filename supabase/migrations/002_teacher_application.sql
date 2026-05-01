-- ============================================================
-- 002_teacher_application.sql
-- Run this in Supabase SQL Editor after 001_auth_schema.sql
-- ============================================================

-- Ensure columns exist (safe even if 001 already added them)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS teacher_status text DEFAULT 'none';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio text;

-- ── Teacher status transition guard ──────────────────────────
-- auth.uid() is NULL when called via service role (admin).
-- Regular users (auth.uid() not null) cannot self-approve.
CREATE OR REPLACE FUNCTION public.validate_teacher_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    -- Block self-approval or self-rejection
    IF NEW.teacher_status IN ('approved', 'rejected')
       AND OLD.teacher_status NOT IN ('approved', 'rejected') THEN
      RAISE EXCEPTION 'Cannot self-approve teacher status';
    END IF;

    -- Can only move to pending from none or rejected
    IF NEW.teacher_status = 'pending'
       AND OLD.teacher_status NOT IN ('none', 'rejected') THEN
      RAISE EXCEPTION 'Can only apply when status is none or rejected';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_teacher_status ON public.profiles;
CREATE TRIGGER validate_teacher_status
  BEFORE UPDATE OF teacher_status ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_teacher_status();
