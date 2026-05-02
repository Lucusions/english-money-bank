-- ============================================================
-- 003_explanations.sql
-- Run after 002_teacher_application.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS public.explanations (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid        NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  teacher_id  uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content     text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_explanations_question_id ON public.explanations(question_id);
CREATE INDEX IF NOT EXISTS idx_explanations_teacher_id  ON public.explanations(teacher_id);

ALTER TABLE public.explanations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read explanations"
  ON public.explanations FOR SELECT USING (true);

CREATE POLICY "Approved teachers can insert explanations"
  ON public.explanations FOR INSERT
  WITH CHECK (
    auth.uid() = teacher_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND teacher_status = 'approved'
    )
  );

CREATE POLICY "Teachers can update own explanations"
  ON public.explanations FOR UPDATE
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete own explanations"
  ON public.explanations FOR DELETE
  USING (auth.uid() = teacher_id);
