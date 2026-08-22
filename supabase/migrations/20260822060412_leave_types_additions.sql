-- =========================================================
-- LEAVE TYPES: additive reconciliation
--
-- This file originally re-created public.leave_types from scratch
-- (CREATE TABLE, a seed INSERT with no ON CONFLICT guard, RLS enable,
-- and 3 SELECT/INSERT/UPDATE policies). All of that duplicated the
-- table already live via 20260822060408_initial_dayflow_schema.sql
-- and 20260822060410_seed_leave_types.sql:
--   - CREATE TABLE removed: table already exists live.
--   - Seed INSERT removed: leave_types is already seeded; this file's
--     INSERT had no ON CONFLICT clause and would have errored on the
--     unique(name) constraint if ever run against the live database.
--   - ALTER TABLE ... ENABLE ROW LEVEL SECURITY removed: already
--     enabled live (re-enabling is harmless but redundant).
--   - authenticated_select_active_leave_types / admins_insert_leave_types /
--     admins_update_leave_types removed: live already has equivalent
--     policies (leave_types_select_authenticated, leave_types_admin_insert,
--     leave_types_admin_update) covering the same capability. Note one
--     real semantic difference that was here and is NOT carried forward:
--     this file's SELECT policy was `is_active = true` only, narrower
--     than live's `is_active = TRUE OR public.is_admin()` (which lets
--     admins see inactive leave types too) — since RLS permissive
--     policies are OR'd together, adding the narrower version back
--     alongside live's policy would have had no practical effect anyway.
--
-- What's kept below is genuinely new relative to live: live's
-- leave_types has no created_at/updated_at columns and no DELETE
-- policy at all.
-- =========================================================

alter table public.leave_types
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.update_leave_type_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trigger_update_leave_type_updated_at on public.leave_types;
create trigger trigger_update_leave_type_updated_at
  before update on public.leave_types
  for each row
  execute procedure public.update_leave_type_updated_at();

create policy "admins_delete_leave_types"
  on public.leave_types
  for delete
  using (public.is_admin());
