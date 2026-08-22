-- =========================================================
-- APPROVE LEAVE TRANSACTION
-- =========================================================

create or replace function public.approve_leave(
  p_leave_request_id uuid,
  p_comment text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.leave_requests;
  v_admin_id uuid;
  v_approval_id uuid;
  v_attendance_exists boolean;
  v_current_date date;
begin
  -- Verify admin
  v_admin_id := auth.uid();
  if not public.is_admin() then
    raise exception 'FORBIDDEN: You do not have permission to perform this action.';
  end if;

  -- Verify request exists
  select * into v_request
  from public.leave_requests
  where id = p_leave_request_id
  for update;

  if not found then
    raise exception 'NOT_FOUND: Leave request not found.';
  end if;

  -- Verify request is Pending
  if v_request.status != 'Pending' then
    raise exception 'CONFLICT: Leave request is already processed.';
  end if;

  -- Create leave_approval
  insert into public.leave_approvals (leave_request_id, approved_by, decision, comment)
  values (p_leave_request_id, v_admin_id, 'Approved', p_comment)
  returning id into v_approval_id;

  -- Update leave_requests status
  update public.leave_requests
  set status = 'Approved'
  where id = p_leave_request_id;

  -- Create/Update attendance records for each date in the leave period
  v_current_date := v_request.start_date;

  while v_current_date <= v_request.end_date loop
    -- Check if attendance record exists
    select exists (
      select 1 from public.attendance_records
      where employee_id = v_request.employee_id
        and attendance_date = v_current_date
    ) into v_attendance_exists;

    if v_attendance_exists then
      -- Update existing attendance record
      update public.attendance_records
      set status = 'Leave',
          check_in = null,
          check_out = null,
          updated_at = now()
      where employee_id = v_request.employee_id
        and attendance_date = v_current_date;
    else
      -- Create new attendance record
      insert into public.attendance_records (employee_id, attendance_date, status)
      values (v_request.employee_id, v_current_date, 'Leave');
    end if;

    v_current_date := v_current_date + interval '1 day';
  end loop;

  -- If we get here, everything succeeded
  -- COMMIT is automatic at end of function
end;
$$;

-- =========================================================
-- REJECT LEAVE TRANSACTION
-- =========================================================

create or replace function public.reject_leave(
  p_leave_request_id uuid,
  p_comment text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.leave_requests;
  v_admin_id uuid;
  v_approval_id uuid;
begin
  -- Verify admin
  v_admin_id := auth.uid();
  if not public.is_admin() then
    raise exception 'FORBIDDEN: You do not have permission to perform this action.';
  end if;

  -- Verify request exists
  select * into v_request
  from public.leave_requests
  where id = p_leave_request_id
  for update;

  if not found then
    raise exception 'NOT_FOUND: Leave request not found.';
  end if;

  -- Verify request is Pending
  if v_request.status != 'Pending' then
    raise exception 'CONFLICT: Leave request is already processed.';
  end if;

  -- Create leave_approval
  insert into public.leave_approvals (leave_request_id, approved_by, decision, comment)
  values (p_leave_request_id, v_admin_id, 'Rejected', p_comment)
  returning id into v_approval_id;

  -- Update leave_requests status
  update public.leave_requests
  set status = 'Rejected'
  where id = p_leave_request_id;

  -- No attendance records should be created for rejected leave
  -- COMMIT is automatic
end;
$$;

-- =========================================================
-- GRANT EXECUTE PERMISSIONS
-- =========================================================

grant execute on function public.approve_leave(uuid, text) to authenticated;
grant execute on function public.reject_leave(uuid, text) to authenticated;