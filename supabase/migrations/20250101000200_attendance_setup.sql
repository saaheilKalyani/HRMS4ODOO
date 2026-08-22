-- =========================================================
-- ATTENDANCE RECORDS TABLE
-- =========================================================

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  attendance_date date not null,
  check_in timestamptz,
  check_out timestamptz,
  status text not null check (status in ('Present', 'Absent', 'Half-day', 'Leave')),
  total_hours numeric generated always as (
    case
      when check_in is not null and check_out is not null
      then round(extract(epoch from (check_out - check_in)) / 3600.0, 2)
      else null
    end
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- UNIQUE constraint: one attendance record per employee per day
  constraint unique_employee_attendance_date unique (employee_id, attendance_date),
  
  -- check_out must be after check_in
  constraint check_out_after_check_in check (
    check_out is null or check_in is null or check_out > check_in
  )
);

-- =========================================================
-- ENABLE RLS
-- =========================================================

alter table public.attendance_records enable row level security;

-- =========================================================
-- RLS POLICIES
-- =========================================================

-- Employees can view their own attendance
create policy "employees_select_own_attendance"
  on public.attendance_records
  for select
  using (
    employee_id in (
      select id from public.employees
      where profile_id = auth.uid()
    )
  );

-- Employees can insert their own attendance
create policy "employees_insert_own_attendance"
  on public.attendance_records
  for insert
  with check (
    employee_id in (
      select id from public.employees
      where profile_id = auth.uid()
    )
  );

-- Employees can update their own attendance
create policy "employees_update_own_attendance"
  on public.attendance_records
  for update
  using (
    employee_id in (
      select id from public.employees
      where profile_id = auth.uid()
    )
  )
  with check (
    employee_id in (
      select id from public.employees
      where profile_id = auth.uid()
    )
  );

-- Admin can view all attendance
create policy "admins_select_all_attendance"
  on public.attendance_records
  for select
  using (public.is_admin());

-- Admin can insert attendance
create policy "admins_insert_attendance"
  on public.attendance_records
  for insert
  with check (public.is_admin());

-- Admin can update attendance
create policy "admins_update_attendance"
  on public.attendance_records
  for update
  using (public.is_admin())
  with check (public.is_admin());

-- =========================================================
-- TRIGGER TO UPDATE updated_at
-- =========================================================

create or replace function public.update_attendance_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trigger_update_attendance_updated_at
  before update on public.attendance_records
  for each row
  execute procedure public.update_attendance_updated_at();