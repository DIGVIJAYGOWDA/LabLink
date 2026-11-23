-- LabLink database schema (Supabase PostgreSQL) - initial migration, v1.
-- Run once in the Supabase SQL editor (or `psql -f database/schema.sql`). Safe to re-run.
-- Column names match the backend models in backend/app/schemas/lab.py.

-- ---------- Lab resources (catalogue) ----------
create table if not exists public.resources (
  id                text primary key,
  name              text not null check (char_length(name) between 1 and 120),
  type              text not null check (type in ('equipment', 'kit', 'workstation')),
  department        text not null check (char_length(department) between 1 and 80),
  lab               text not null check (char_length(lab) between 1 and 80),
  description       text not null default '',
  requires_approval boolean not null default false,
  status            text not null default 'available' check (status in ('available', 'maintenance')),
  created_at        timestamptz not null default now(),
  constraint uq_resources_name_lab unique (name, department, lab)
);

create index if not exists idx_resources_department on public.resources (department);

-- ---------- Bookings and project-based access requests ----------
create table if not exists public.bookings (
  id            text primary key,
  resource_id   text not null references public.resources (id) on update cascade on delete restrict,
  date          date not null,
  slot_id       text not null check (slot_id in ('s1', 's2', 's3', 's4')),
  student_name  text not null check (char_length(student_name) between 1 and 80),
  project_title text not null check (char_length(project_title) between 3 and 80),
  purpose       text not null default '' check (char_length(purpose) <= 400),
  deadline      date not null,
  status        text not null check (status in ('confirmed', 'pending', 'rejected', 'cancelled')),
  created_at    timestamptz not null default now(),
  faculty_note  text check (char_length(faculty_note) <= 300)
);

-- A slot can hold only one confirmed booking (several pending requests = a conflict to resolve).
create unique index if not exists uq_bookings_confirmed_slot
  on public.bookings (resource_id, date, slot_id)
  where status = 'confirmed';

-- A student cannot hold two active bookings/requests for the same slot.
create unique index if not exists uq_bookings_student_slot
  on public.bookings (resource_id, date, slot_id, lower(student_name))
  where status in ('pending', 'confirmed');

create index if not exists idx_bookings_resource_date on public.bookings (resource_id, date);
create index if not exists idx_bookings_date on public.bookings (date);
create index if not exists idx_bookings_student on public.bookings (lower(student_name));
create index if not exists idx_bookings_pending on public.bookings (resource_id, date, slot_id) where status = 'pending';

-- ---------- Activity feed ----------
create table if not exists public.activities (
  id      text primary key,
  kind    text not null check (kind in ('booking', 'request', 'approval', 'rejection', 'cancellation', 'allocation')),
  message text not null check (char_length(message) between 1 and 300),
  at      timestamptz not null default now()
);

create index if not exists idx_activities_at on public.activities (at desc);

-- ---------- Access control ----------
-- The backend uses the service-role key, which bypasses RLS. Enabling RLS with no policies
-- keeps the tables closed to the public anon key.
alter table public.resources enable row level security;
alter table public.bookings enable row level security;
alter table public.activities enable row level security;
