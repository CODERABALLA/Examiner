-- ============================================================
-- EXAMINER STUDY PROGRESSION
-- Adds fields required for the study flow:
--   completed  - whether the question has been completed by the student
--   due_at     - optional visible due date (fixes persistence bug)
--   sort_order - deterministic ordering within a unit so that the
--                study flow does not rely on unpredictable DB ordering
-- ============================================================

alter table questions
  add column if not exists completed boolean not null default false;

alter table questions
  add column if not exists due_at timestamptz;

alter table questions
  add column if not exists sort_order integer not null default 0;

-- Backfill sort_order deterministically for existing rows so older data
-- is ordered by creation time first (oldest first is the stable default).
with ranked as (
  select
    id,
    row_number() over (
      partition by subject, unit
      order by created_at asc, id asc
    ) - 1 as ordinal
  from questions
)
update questions q
set sort_order = r.ordinal
from ranked r
where q.id = r.id;

-- Deterministic lookup: order questions within a subject+unit.
create index if not exists idx_questions_study_order
on questions(subject, unit, difficulty, sort_order);
