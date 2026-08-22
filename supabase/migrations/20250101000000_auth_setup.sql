-- =========================================================
-- PROFILES
-- =========================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'employee' check (role in ('employee', 'admin')),
  display_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- EMPLOYEES
-- =========================================================
create table public.employees (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  employee_code text not null unique,
  full_name text not null,
  phone text,
  address text,
  department text,
  job_title text,
  joining_date date,
  employment_status text not null default 'Active' check (employment_status in ('Active', 'Inactive')),
  profile_picture_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- SIGNUP TRIGGER
-- Creates profile + employee automatically when auth.users is inserted
-- =========================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_full_name text;
  v_employee_code text;
begin
  v_full_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  v_employee_code := 'EMP-' || upper(substr(replace(new.id::text, '-', ''), 1, 8));

  insert into public.profiles (id, email, role, display_name, is_active)
  values (new.id, new.email, 'employee', v_full_name, true);

  insert into public.employees (profile_id, employee_code, full_name)
  values (new.id, v_employee_code, v_full_name);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================
-- RLS HELPER
-- =========================================================
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and is_active = true
  );
$$;

-- =========================================================
-- ENABLE RLS
-- =========================================================
alter table public.profiles enable row level security;
alter table public.employees enable row level security;

-- =========================================================
-- RLS POLICIES — PROFILES
-- =========================================================
create policy "profiles_select_own_or_admin"
  on public.profiles
  for select
  using (id = auth.uid() or public.is_admin());

create policy "profiles_update_own"
  on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- =========================================================
-- RLS POLICIES — EMPLOYEES
-- =========================================================
create policy "employees_select_own_or_admin"
  on public.employees
  for select
  using (profile_id = auth.uid() or public.is_admin());

create policy "employees_update_own_or_admin"
  on public.employees
  for update
  using (profile_id = auth.uid() or public.is_admin())
  with check (profile_id = auth.uid() or public.is_admin());

create policy "employees_insert_admin"
  on public.employees
  for insert
  with check (public.is_admin());