-- ============================================================
-- DAYFLOW HRMS
-- Initial Database Schema
-- Schema Version: 1.0
-- ============================================================

-- ------------------------------------------------------------
-- Extensions
-- ------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";


-- ------------------------------------------------------------
-- Helper: updated_at trigger
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


-- ------------------------------------------------------------
-- Helper: admin authorization
-- SECURITY DEFINER avoids RLS recursion when checking profiles.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'admin'
          AND is_active = TRUE
    );
$$;


-- ============================================================
-- 1. PROFILES
-- ============================================================

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY
        REFERENCES auth.users(id) ON DELETE RESTRICT,

    email TEXT NOT NULL UNIQUE,

    role TEXT NOT NULL
        CHECK (role IN ('employee', 'admin')),

    display_name TEXT NOT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 2. EMPLOYEES
-- ============================================================

CREATE TABLE public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    profile_id UUID NOT NULL UNIQUE
        REFERENCES public.profiles(id) ON DELETE RESTRICT,

    employee_code TEXT NOT NULL UNIQUE,

    full_name TEXT NOT NULL,

    phone TEXT,

    address TEXT,

    department TEXT,

    job_title TEXT,

    joining_date DATE,

    employment_status TEXT NOT NULL DEFAULT 'Active'
        CHECK (employment_status IN ('Active', 'Inactive')),

    profile_picture_url TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 3. ATTENDANCE_RECORDS
-- ============================================================

CREATE TABLE public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    employee_id UUID NOT NULL
        REFERENCES public.employees(id) ON DELETE RESTRICT,

    attendance_date DATE NOT NULL,

    check_in TIMESTAMPTZ,

    check_out TIMESTAMPTZ,

    status TEXT NOT NULL
        CHECK (status IN ('Present', 'Absent', 'Half-day', 'Leave')),

    total_hours NUMERIC(5,2)
        GENERATED ALWAYS AS (
            CASE
                WHEN check_in IS NOT NULL
                 AND check_out IS NOT NULL
                 AND check_out > check_in
                THEN ROUND(
                    (EXTRACT(EPOCH FROM (check_out - check_in)) / 3600)::numeric,
                    2
                )
                ELSE 0
            END
        ) STORED,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT attendance_employee_date_unique
        UNIQUE (employee_id, attendance_date),

    CONSTRAINT attendance_checkout_after_checkin
        CHECK (
            check_in IS NULL
            OR check_out IS NULL
            OR check_out > check_in
        )
);


-- ============================================================
-- 4. LEAVE_TYPES
-- ============================================================

CREATE TABLE public.leave_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL UNIQUE,

    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE
);


-- ============================================================
-- 5. LEAVE_REQUESTS
-- ============================================================

CREATE TABLE public.leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    employee_id UUID NOT NULL
        REFERENCES public.employees(id) ON DELETE RESTRICT,

    leave_type_id UUID NOT NULL
        REFERENCES public.leave_types(id) ON DELETE RESTRICT,

    start_date DATE NOT NULL,

    end_date DATE NOT NULL,

    reason TEXT,

    status TEXT NOT NULL DEFAULT 'Pending'
        CHECK (status IN ('Pending', 'Approved', 'Rejected')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT leave_request_date_range
        CHECK (start_date <= end_date)
);


-- ============================================================
-- 6. LEAVE_APPROVALS
-- ============================================================

CREATE TABLE public.leave_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    leave_request_id UUID NOT NULL UNIQUE
        REFERENCES public.leave_requests(id) ON DELETE CASCADE,

    approved_by UUID NOT NULL
        REFERENCES public.profiles(id) ON DELETE RESTRICT,

    decision TEXT NOT NULL
        CHECK (decision IN ('Approved', 'Rejected')),

    comment TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 7. SALARY_STRUCTURES
-- ============================================================

CREATE TABLE public.salary_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    employee_id UUID NOT NULL
        REFERENCES public.employees(id) ON DELETE RESTRICT,

    basic_salary NUMERIC(12,2) NOT NULL DEFAULT 0
        CHECK (basic_salary >= 0),

    allowances NUMERIC(12,2) NOT NULL DEFAULT 0
        CHECK (allowances >= 0),

    deductions NUMERIC(12,2) NOT NULL DEFAULT 0
        CHECK (deductions >= 0),

    net_salary NUMERIC(12,2)
        GENERATED ALWAYS AS (
            basic_salary + allowances - deductions
        ) STORED,

    effective_from DATE NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT salary_net_non_negative
        CHECK (basic_salary + allowances - deductions >= 0)
);


-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


CREATE TRIGGER employees_set_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


CREATE TRIGGER attendance_set_updated_at
BEFORE UPDATE ON public.attendance_records
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


CREATE TRIGGER leave_requests_set_updated_at
BEFORE UPDATE ON public.leave_requests
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


CREATE TRIGGER salary_structures_set_updated_at
BEFORE UPDATE ON public.salary_structures
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_employees_department
    ON public.employees(department);

CREATE INDEX idx_attendance_employee
    ON public.attendance_records(employee_id);

CREATE INDEX idx_attendance_date
    ON public.attendance_records(attendance_date);

CREATE INDEX idx_leave_requests_employee
    ON public.leave_requests(employee_id);

CREATE INDEX idx_leave_requests_status
    ON public.leave_requests(status);

CREATE INDEX idx_leave_requests_dates
    ON public.leave_requests(start_date, end_date);

CREATE INDEX idx_salary_employee
    ON public.salary_structures(employee_id);

CREATE INDEX idx_salary_effective_from
    ON public.salary_structures(effective_from);


-- ============================================================
-- SEED LEAVE TYPES
-- ============================================================

INSERT INTO public.leave_types (name, description)
VALUES
    ('Paid Leave', 'Paid employee leave'),
    ('Sick Leave', 'Leave due to illness'),
    ('Unpaid Leave', 'Leave without salary'),
    ('Casual Leave', 'Short-term casual leave')
ON CONFLICT (name) DO NOTHING;


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_structures ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- PROFILES POLICIES
-- ============================================================

CREATE POLICY profiles_select_own
ON public.profiles
FOR SELECT
TO authenticated
USING (
    id = auth.uid()
    OR public.is_admin()
);


CREATE POLICY profiles_update_own
ON public.profiles
FOR UPDATE
TO authenticated
USING (
    id = auth.uid()
    OR public.is_admin()
)
WITH CHECK (
    id = auth.uid()
    OR public.is_admin()
);


CREATE POLICY profiles_admin_insert
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_admin()
);


-- ============================================================
-- EMPLOYEES POLICIES
-- ============================================================

CREATE POLICY employees_select_own_or_admin
ON public.employees
FOR SELECT
TO authenticated
USING (
    profile_id = auth.uid()
    OR public.is_admin()
);


CREATE POLICY employees_admin_insert
ON public.employees
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_admin()
);


CREATE POLICY employees_admin_update
ON public.employees
FOR UPDATE
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);


-- ============================================================
-- ATTENDANCE POLICIES
-- ============================================================

CREATE POLICY attendance_select_own_or_admin
ON public.attendance_records
FOR SELECT
TO authenticated
USING (
    employee_id IN (
        SELECT e.id
        FROM public.employees e
        WHERE e.profile_id = auth.uid()
    )
    OR public.is_admin()
);


CREATE POLICY attendance_insert_own_or_admin
ON public.attendance_records
FOR INSERT
TO authenticated
WITH CHECK (
    employee_id IN (
        SELECT e.id
        FROM public.employees e
        WHERE e.profile_id = auth.uid()
    )
    OR public.is_admin()
);


CREATE POLICY attendance_update_own_or_admin
ON public.attendance_records
FOR UPDATE
TO authenticated
USING (
    employee_id IN (
        SELECT e.id
        FROM public.employees e
        WHERE e.profile_id = auth.uid()
    )
    OR public.is_admin()
)
WITH CHECK (
    employee_id IN (
        SELECT e.id
        FROM public.employees e
        WHERE e.profile_id = auth.uid()
    )
    OR public.is_admin()
);


-- ============================================================
-- LEAVE TYPES POLICIES
-- ============================================================

CREATE POLICY leave_types_select_authenticated
ON public.leave_types
FOR SELECT
TO authenticated
USING (
    is_active = TRUE
    OR public.is_admin()
);


CREATE POLICY leave_types_admin_insert
ON public.leave_types
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_admin()
);


CREATE POLICY leave_types_admin_update
ON public.leave_types
FOR UPDATE
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);


-- ============================================================
-- LEAVE REQUEST POLICIES
-- ============================================================

CREATE POLICY leave_requests_select_own_or_admin
ON public.leave_requests
FOR SELECT
TO authenticated
USING (
    employee_id IN (
        SELECT e.id
        FROM public.employees e
        WHERE e.profile_id = auth.uid()
    )
    OR public.is_admin()
);


CREATE POLICY leave_requests_insert_own
ON public.leave_requests
FOR INSERT
TO authenticated
WITH CHECK (
    employee_id IN (
        SELECT e.id
        FROM public.employees e
        WHERE e.profile_id = auth.uid()
    )
);


CREATE POLICY leave_requests_admin_update
ON public.leave_requests
FOR UPDATE
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);


-- ============================================================
-- LEAVE APPROVAL POLICIES
-- ============================================================

CREATE POLICY leave_approvals_admin_select
ON public.leave_approvals
FOR SELECT
TO authenticated
USING (
    public.is_admin()
);


CREATE POLICY leave_approvals_admin_insert
ON public.leave_approvals
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_admin()
);


-- ============================================================
-- SALARY POLICIES
-- ============================================================

CREATE POLICY salary_select_own_or_admin
ON public.salary_structures
FOR SELECT
TO authenticated
USING (
    employee_id IN (
        SELECT e.id
        FROM public.employees e
        WHERE e.profile_id = auth.uid()
    )
    OR public.is_admin()
);


CREATE POLICY salary_admin_insert
ON public.salary_structures
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_admin()
);


CREATE POLICY salary_admin_update
ON public.salary_structures
FOR UPDATE
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);


-- ============================================================
-- TRANSACTIONAL LEAVE APPROVAL
-- ============================================================

CREATE OR REPLACE FUNCTION public.approve_leave_request(
    p_leave_request_id UUID,
    p_decision TEXT,
    p_comment TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_request public.leave_requests%ROWTYPE;
    v_approval_id UUID;
BEGIN

    -- Only admins may approve/reject leave.
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only administrators can approve leave requests';
    END IF;

    IF p_decision NOT IN ('Approved', 'Rejected') THEN
        RAISE EXCEPTION 'Invalid decision: %', p_decision;
    END IF;

    -- Lock the request so two admins cannot process it simultaneously.
    SELECT *
    INTO v_request
    FROM public.leave_requests
    WHERE id = p_leave_request_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Leave request not found';
    END IF;

    IF v_request.status <> 'Pending' THEN
        RAISE EXCEPTION 'Leave request has already been processed';
    END IF;

    -- Update leave request status.
    UPDATE public.leave_requests
    SET
        status = p_decision,
        updated_at = NOW()
    WHERE id = p_leave_request_id;

    -- Create final approval record.
    INSERT INTO public.leave_approvals (
        leave_request_id,
        approved_by,
        decision,
        comment
    )
    VALUES (
        p_leave_request_id,
        auth.uid(),
        p_decision,
        p_comment
    )
    RETURNING id INTO v_approval_id;

    -- If approved, mark the entire leave period as Leave.
    IF p_decision = 'Approved' THEN

        -- Existing attendance records.
        UPDATE public.attendance_records
        SET
            status = 'Leave',
            check_in = NULL,
            check_out = NULL,
            updated_at = NOW()
        WHERE employee_id = v_request.employee_id
          AND attendance_date BETWEEN
              v_request.start_date AND v_request.end_date;

        -- Missing attendance records.
        INSERT INTO public.attendance_records (
            employee_id,
            attendance_date,
            status
        )
        SELECT
            v_request.employee_id,
            d::date,
            'Leave'
        FROM generate_series(
            v_request.start_date,
            v_request.end_date,
            INTERVAL '1 day'
        ) AS d
        WHERE NOT EXISTS (
            SELECT 1
            FROM public.attendance_records ar
            WHERE ar.employee_id = v_request.employee_id
              AND ar.attendance_date = d::date
        );

    END IF;

END;
$$;


-- Only authenticated users can execute the function.
REVOKE ALL
ON FUNCTION public.approve_leave_request(UUID, TEXT, TEXT)
FROM PUBLIC;

GRANT EXECUTE
ON FUNCTION public.approve_leave_request(UUID, TEXT, TEXT)
TO authenticated;


-- ============================================================
-- END OF DAYFLOW INITIAL SCHEMA
-- ============================================================