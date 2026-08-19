-- ============================================================
-- EXAMINER DATABASE
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- USERS
-- ============================================================

create table if not exists users (
  id uuid primary key default gen_random_uuid(),

  name text not null,

  email text unique not null,

  role text not null
    check (role in ('admin', 'student')),

  created_at timestamptz not null default now()
);

-- ============================================================
-- STUDY SESSIONS
-- ============================================================

create table if not exists study_sessions (
  id uuid primary key default gen_random_uuid(),

  title text not null,

  subject text not null,

  unit text not null,

  created_at timestamptz not null default now()
);

-- ============================================================
-- STUDENTS ASSIGNED TO SESSIONS
-- ============================================================

create table if not exists session_students (
  session_id uuid not null
    references study_sessions(id)
    on delete cascade,

  student_id uuid not null
    references users(id)
    on delete cascade,

  primary key (session_id, student_id)
);

-- ============================================================
-- QUESTIONS
-- ============================================================

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),

  question text not null,

  answer text not null,

  subject text not null,

  unit text not null,

  difficulty text not null
    check (
      difficulty in (
        'Easy',
        'Intermediate',
        'Advanced'
      )
    ),

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);

-- ============================================================
-- QUESTIONS INSIDE SESSIONS
-- ============================================================

create table if not exists session_questions (
  session_id uuid not null
    references study_sessions(id)
    on delete cascade,

  question_id uuid not null
    references questions(id)
    on delete cascade,

  question_order integer not null default 0,

  primary key (session_id, question_id)
);

-- ============================================================
-- STUDENT PROGRESS
-- ============================================================

create table if not exists question_progress (
  student_id uuid not null
    references users(id)
    on delete cascade,

  question_id uuid not null
    references questions(id)
    on delete cascade,

  completed boolean not null default false,

  completed_at timestamptz,

  primary key (student_id, question_id)
);

-- ============================================================
-- APPLICATION SETTINGS
-- ============================================================

create table if not exists app_settings (
  key text primary key,

  value text not null,

  updated_at timestamptz not null default now()
);

-- ============================================================
-- PERMANENT GOOGLE MEET LINK
-- ============================================================

insert into app_settings (
  key,
  value
)
values (
  'google_meet_link',
  ''
)
on conflict (key) do nothing;

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists idx_questions_subject_unit
on questions(subject, unit);

create index if not exists idx_session_students_student
on session_students(student_id);

create index if not exists idx_session_questions_session
on session_questions(session_id);

create index if not exists idx_question_progress_student
on question_progress(student_id);

-- ============================================================
-- UPDATED_AT FUNCTION
-- ============================================================

create or replace function update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- QUESTIONS UPDATED_AT TRIGGER
-- ============================================================

drop trigger if exists questions_updated_at
on questions;

create trigger questions_updated_at
before update on questions
for each row
execute function update_updated_at();
