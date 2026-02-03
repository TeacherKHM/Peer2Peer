-- Enable RLS on rubrics table if not already enabled
ALTER TABLE rubrics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Teachers can create rubrics" ON rubrics;
DROP POLICY IF EXISTS "Teachers can view all rubrics" ON rubrics;
DROP POLICY IF EXISTS "Teachers can update rubrics" ON rubrics;
DROP POLICY IF EXISTS "Students can view rubrics for their assignments" ON rubrics;

-- Policy: Teachers can create rubrics
CREATE POLICY "Teachers can create rubrics"
ON rubrics
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'teacher'
    )
);

-- Policy: Teachers can view all rubrics
CREATE POLICY "Teachers can view all rubrics"
ON rubrics
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'teacher'
    )
);

-- Policy: Teachers can update their rubrics
CREATE POLICY "Teachers can update rubrics"
ON rubrics
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'teacher'
    )
);

-- Policy: Students can view rubrics for assignments they're involved in
CREATE POLICY "Students can view rubrics for their assignments"
ON rubrics
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'student'
    )
    AND (
        assignment_id IS NULL  -- Templates are visible
        OR EXISTS (
            SELECT 1 FROM submissions
            WHERE submissions.assignment_id = rubrics.assignment_id
            AND submissions.student_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM reviews r
            JOIN submissions s ON r.submission_id = s.id
            WHERE s.assignment_id = rubrics.assignment_id
            AND r.reviewer_id = auth.uid()
        )
    )
);
