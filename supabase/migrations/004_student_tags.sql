-- ============================================================
-- 004_student_tags.sql
-- Safe to run even if tags / question_tags already exist.
-- ============================================================

-- tags table
CREATE TABLE IF NOT EXISTS public.tags (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  category   text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Unique constraint so find-or-create works correctly
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tags_name_category_key'
      AND conrelid = 'public.tags'::regclass
  ) THEN
    ALTER TABLE public.tags ADD CONSTRAINT tags_name_category_key UNIQUE (name, category);
  END IF;
END $$;

-- question_tags junction table
CREATE TABLE IF NOT EXISTS public.question_tags (
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  tag_id      uuid NOT NULL REFERENCES public.tags(id)      ON DELETE CASCADE
);

-- Remove any duplicate rows before adding PK (safe no-op if already clean)
DELETE FROM public.question_tags
WHERE ctid NOT IN (
  SELECT MIN(ctid)
  FROM public.question_tags
  GROUP BY question_id, tag_id
);

-- Add primary key if missing
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'question_tags_pkey'
      AND conrelid = 'public.question_tags'::regclass
  ) THEN
    ALTER TABLE public.question_tags ADD PRIMARY KEY (question_id, tag_id);
  END IF;
END $$;

-- Add FK from question_tags.tag_id → tags.id if missing
-- (CREATE TABLE IF NOT EXISTS skips this when the table pre-exists)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'question_tags_tag_id_fkey'
      AND conrelid = 'public.question_tags'::regclass
  ) THEN
    ALTER TABLE public.question_tags
      ADD CONSTRAINT question_tags_tag_id_fkey
      FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add FK from question_tags.question_id → questions.id if missing
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'question_tags_question_id_fkey'
      AND conrelid = 'public.question_tags'::regclass
  ) THEN
    ALTER TABLE public.question_tags
      ADD CONSTRAINT question_tags_question_id_fkey
      FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE;
  END IF;
END $$;

-- RLS
ALTER TABLE public.tags          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_tags ENABLE ROW LEVEL SECURITY;

-- Public read (idempotent)
DROP POLICY IF EXISTS "Anyone can read tags"          ON public.tags;
CREATE POLICY "Anyone can read tags"
  ON public.tags FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can read question_tags" ON public.question_tags;
CREATE POLICY "Anyone can read question_tags"
  ON public.question_tags FOR SELECT USING (true);
