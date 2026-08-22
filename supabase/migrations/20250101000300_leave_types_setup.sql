-- =========================================================
-- LEAVE TYPES TABLE
-- =========================================================

create table public.leave_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- SEED DATA (Frozen P0 values)
-- =========================================================

insert into public.leave_types (name, description, is_active) values
  ('Paid Leave', 'Paid time off', true),
  ('Sick Leave', 'Medical leave', true),
  ('Unpaid Leave', 'Leave without pay', true),
  ('Casual Leave', 'Casual time off', true);

-- =========================================================
-- ENABLE RLS
-- =========================================================

alter table public.leave_types enable row level security;

-- =========================================================
-- RLS POLICIES
-- =========================================================

-- All authenticated users can view active leave types
create policy "authenticated_select_active_leave_types"
  on public.leave_types
  for select
  using (is_active = true);

-- Only admins can insert/update/delete leave types
create policy "admins_insert_leave_types"
  on public.leave_types
  for insert
  with check (public.is_admin());

create policy "admins_update_leave_types"
  on public.leave_types
  for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins_delete_leave_types"
  on public.leave_types
  for delete
  using (public.is_admin());

-- =========================================================
-- TRIGGER TO UPDATE updated_at
-- =========================================================

create or replace function public.update_leave_type_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trigger_update_leave_type_updated_at
  before update on public.leave_types
  for each row
  execute procedure public.update_leave_type_updated_at();