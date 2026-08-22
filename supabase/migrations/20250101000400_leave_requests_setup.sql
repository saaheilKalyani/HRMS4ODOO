-- =========================================================
-- LEAVE REQUESTS TABLE
-- =========================================================

create table public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  leave_type_id uuid not null references public.leave_types(id),
  start_date date not null,
  end_date date not null,
  reason text,
  status text not null default 'Pending' check (status in ('Pending', 'Approved', 'Rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- Validate dates
  constraint end_date_after_start_date check (end_date >= start_date)
);

-- =========================================================
-- LEAVE APPROVALS TABLE
-- =========================================================

create table public.leave_approvals (
  id uuid primary key default gen_random_uuid(),
  leave_request_id uuid not null unique references public.leave_requests(id) on delete cascade,
  approved_by uuid not null references public.profiles(id),
  decision text not null check (decision in ('Approved', 'Rejected')),
  comment text,
  created_at timestamptz not null default now()
);

-- =========================================================
-- ENABLE RLS
-- =========================================================

alter table public.leave_requests enable row level security;
alter table public.leave_approvals enable row level security;

-- =========================================================
-- RLS POLICIES - LEAVE REQUESTS
-- =========================================================

-- Employees can view their own leave requests
create policy "employees_select_own_leave_requests"
  on public.leave_requests
  for select
  using (
    employee_id in (
      select id from public.employees where profile_id = auth.uid()
    )
  );

-- Employees can insert their own leave requests
create policy "employees_insert_own_leave_requests"
  on public.leave_requests
  for insert
  with check (
    employee_id in (
      select id from public.employees where profile_id = auth.uid()
    )
    and status = 'Pending'
  );

-- Employees can update their own pending leave requests
create policy "employees_update_own_pending_leave_requests"
  on public.leave_requests
  for update
  using (
    employee_id in (
      select id from public.employees where profile_id = auth.uid()
    )
    and status = 'Pending'
  );

-- Admin can view all leave requests
create policy "admins_select_all_leave_requests"
  on public.leave_requests
  for select
  using (public.is_admin());

-- Admin can update all leave requests
create policy "admins_update_all_leave_requests"
  on public.leave_requests
  for update
  using (public.is_admin())
  with check (public.is_admin());

-- =========================================================
-- RLS POLICIES - LEAVE APPROVALS
-- =========================================================

-- Employees can view approvals for their own requests
create policy "employees_select_own_leave_approvals"
  on public.leave_approvals
  for select
  using (
    leave_request_id in (
      select id from public.leave_requests
      where employee_id in (
        select id from public.employees where profile_id = auth.uid()
      )
    )
  );

-- Admin can insert approvals
create policy "admins_insert_leave_approvals"
  on public.leave_approvals
  for insert
  with check (public.is_admin());

-- Admin can view all approvals
create policy "admins_select_all_leave_approvals"
  on public.leave_approvals
  for select
  using (public.is_admin());

-- =========================================================
-- TRIGGERS
-- =========================================================

create or replace function public.update_leave_request_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trigger_update_leave_request_updated_at
  before update on public.leave_requests
  for each row
  execute procedure public.update_leave_request_updated_at();