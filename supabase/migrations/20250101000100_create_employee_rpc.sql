-- =========================================================
-- CREATE EMPLOYEE WITH AUTH
-- Admin only operation
-- =========================================================

create or replace function public.create_employee_with_auth(
  p_email text,
  p_full_name text,
  p_phone text default null,
  p_address text default null,
  p_department text default null,
  p_job_title text default null,
  p_joining_date date default null,
  p_employment_status text default 'Active',
  p_profile_picture_url text default null
)
returns public.employees
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_profile_id uuid;
  v_employee_code text;
  v_employee public.employees;
begin
  -- Check if caller is admin
  if not public.is_admin() then
    raise exception 'FORBIDDEN: You do not have permission to perform this action.';
  end if;

  -- Validate employment_status
  if p_employment_status not in ('Active', 'Inactive') then
    raise exception 'VALIDATION_ERROR: Invalid employment status.';
  end if;

  -- Generate employee code
  v_employee_code := 'EMP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  -- Create auth user (this uses service_role internally)
  -- Note: This requires the function to have access to auth.users
  -- In Supabase, security definer functions can access auth schema if created by postgres role
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) values (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    p_email,
    crypt('temporaryPassword123', gen_salt('bf')), -- This will need to be changed
    now(),
    '{"provider":"email","providers":["email"]}',
    json_build_object('full_name', p_full_name),
    now(),
    now()
  )
  returning id into v_user_id;

  -- Create profile
  insert into public.profiles (id, email, role, display_name, is_active)
  values (v_user_id, p_email, 'employee', p_full_name, true)
  returning id into v_profile_id;

  -- Create employee
  insert into public.employees (
    profile_id,
    employee_code,
    full_name,
    phone,
    address,
    department,
    job_title,
    joining_date,
    employment_status,
    profile_picture_url
  ) values (
    v_profile_id,
    v_employee_code,
    p_full_name,
    p_phone,
    p_address,
    p_department,
    p_job_title,
    p_joining_date,
    p_employment_status,
    p_profile_picture_url
  )
  returning * into v_employee;

  return v_employee;
end;
$$;

-- Grant execute to authenticated users
grant execute on function public.create_employee_with_auth(
  text, text, text, text, text, text, date, text, text
) to authenticated;