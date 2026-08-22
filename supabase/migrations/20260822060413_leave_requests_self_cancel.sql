-- =========================================================
-- LEAVE REQUESTS: allow an employee to update their own
-- Pending request (extracted from the discarded
-- 20250101000400_leave_requests_setup.sql — that file's
-- CREATE TABLE/FK definitions conflicted with what's already
-- live and were not kept; this one policy was the only
-- genuinely new capability in it, live has no self-update
-- path for leave_requests otherwise).
--
-- Note on behavior: no WITH CHECK clause is given, so Postgres
-- defaults it to the same expression as USING — meaning the
-- row must still satisfy employee_id = caller AND status =
-- 'Pending' *after* the update too. In practice this lets an
-- employee edit a still-pending request's other fields (e.g.
-- reason, dates); it does not let them flip status away from
-- 'Pending' via this policy (there's no 'Cancelled' status in
-- the schema to flip to anyway). This is carried forward
-- unchanged from how the source file wrote it.
-- =========================================================

create policy "employees_update_own_pending_leave_requests"
  on public.leave_requests
  for update
  using (
    employee_id in (
      select id from public.employees where profile_id = auth.uid()
    )
    and status = 'Pending'
  );
