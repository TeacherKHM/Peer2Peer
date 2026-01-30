-- Create a table for public profiles linked to auth.users
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  role text check (role in ('student', 'teacher')) default 'student',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update their own profile." on profiles
  for update using (auth.uid() = id);

-- Assignments table
create table assignments (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  due_date timestamp with time zone,
  created_by uuid references profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table assignments enable row level security;

-- Rubrics table (simplified as JSONB for flexibility, or could be separate table)
create table rubrics (
  id uuid default uuid_generate_v4() primary key,
  assignment_id uuid references assignments(id) on delete cascade not null,
  criteria jsonb not null, -- Array of objects: { title, description, max_points }
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table rubrics enable row level security;

create policy "Rubrics are viewable by everyone" on rubrics
  for select using (true);

create policy "Teachers can manage rubrics for their assignments" on rubrics
  for all using (
    exists (
      select 1 from assignments
      where assignments.id = rubrics.assignment_id
      and assignments.created_by = auth.uid()
    )
  );

-- Submissions table
create table submissions (
  id uuid default uuid_generate_v4() primary key,
  assignment_id uuid references assignments(id) on delete cascade not null,
  student_id uuid references profiles(id) not null,
  file_url text not null,
  status text check (status in ('submitted', 'resubmission_pending')) default 'submitted',
  resubmission_justification text,
  new_file_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(assignment_id, student_id)
);

alter table submissions enable row level security;

-- Reviews table
create table reviews (
  id uuid default uuid_generate_v4() primary key,
  submission_id uuid references submissions(id) on delete cascade not null,
  reviewer_id uuid references profiles(id) not null,
  feedback jsonb, -- structured feedback matching rubric
  score integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(submission_id, reviewer_id)
);

alter table reviews enable row level security;

-- Policies (simplified for initial setup)
-- Teachers can do everything on assignments/rubrics
create policy "Teachers can manage assignments" on assignments
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'teacher')
  );

create policy "Students can view assignments" on assignments
  for select using (true); -- modifying to specific logic later if needed

-- Submissions policies
create policy "Students can insert their own submissions" on submissions
  for insert with check (auth.uid() = student_id);

create policy "Students can view their own submissions" on submissions
  for select using (auth.uid() = student_id);

create policy "Teachers can view submissions for their assignments" on submissions
  for select using (
    exists (
      select 1 from assignments
      where assignments.id = submissions.assignment_id
      and assignments.created_by = auth.uid()
    )
  );

create policy "Teachers can update submissions for their assignments" on submissions
  for update using (
    exists (
      select 1 from assignments
      where assignments.id = submissions.assignment_id
      and assignments.created_by = auth.uid()
    )
  );
  
-- Reviews policies
-- Complex logic: Students can view reviews assigned to them or their own submission's reviews
