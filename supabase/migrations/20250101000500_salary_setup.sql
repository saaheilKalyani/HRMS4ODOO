create table public.salary_structures (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  basic_salary numeric not null check (basic_salary >= 0),
  allowances numeric not null default 0 check (allowances >= 0),
  deductions numeric not null default 0 check (deductions >= 0),
  net_salary numeric generated always as (basic_salary + allowances - deductions) stored,
  effective_from date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.salary_structures enable row level security;

create policy "employees_select_own_salary"
  on public.salary_structures for select
  using (employee_id in (select id from public.employees where profile_id = auth.uid()));

create policy "admins_select_all_salaries"
  on public.salary_structures for select
  using (public.is_admin());

create policy "admins_insert_salaries"
  on public.salary_structures for insert
  with check (public.is_admin());

create policy "admins_update_salaries"
  on public.salary_structures for update
  using (public.is_admin()) with check (public.is_admin());