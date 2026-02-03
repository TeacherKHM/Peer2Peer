-- Allow rubrics to have null assignment_id for templates
ALTER TABLE rubrics 
ALTER COLUMN assignment_id DROP NOT NULL;

COMMENT ON COLUMN rubrics.assignment_id IS 'Reference to assignment. NULL means this is a reusable template.';
