ALTER TABLE questions
ADD COLUMN IF NOT EXISTS group_id text,
ADD COLUMN IF NOT EXISTS group_title text,
ADD COLUMN IF NOT EXISTS group_order integer;

CREATE INDEX IF NOT EXISTS idx_questions_group_id
ON questions(group_id);

CREATE INDEX IF NOT EXISTS idx_questions_group_order
ON questions(group_id, group_order);
