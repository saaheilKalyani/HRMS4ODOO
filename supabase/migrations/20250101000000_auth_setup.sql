-- =========================================================
-- SIGNUP TRIGGER
-- Creates profile + employee automatically when auth.users is inserted
--
-- Table definitions (profiles, employees), public.is_admin(), RLS enablement,
-- and RLS policies for these tables live in
-- 20260822060408_initial_dayflow_schema.sql — this file previously duplicated
-- them with conflicting constraints/policy logic; that duplication was removed
-- to resolve the migration conflict. This file now owns only the signup
-- automation, which has no equivalent anywhere else.
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
