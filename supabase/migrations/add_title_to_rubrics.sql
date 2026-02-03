-- Add title column to rubrics table
ALTER TABLE rubrics 
ADD COLUMN IF NOT EXISTS title TEXT;

COMMENT ON COLUMN rubrics.title IS 'Optional title for the rubric template';
