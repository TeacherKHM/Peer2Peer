-- Migration: Add submission_type column to assignments table
-- This allows teachers to specify what type of submissions they accept

ALTER TABLE assignments 
ADD COLUMN submission_type TEXT DEFAULT 'pdf' 
CHECK (submission_type IN ('pdf', 'google_docs', 'url'));

-- Add comment to document the column
COMMENT ON COLUMN assignments.submission_type IS 'Type of submission accepted: pdf, google_docs, or url';
