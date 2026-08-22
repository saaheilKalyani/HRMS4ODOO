-- ============================================================
-- SEED: REQUIRED LEAVE TYPES
-- ============================================================

INSERT INTO public.leave_types (name, description, is_active)
VALUES
    ('Paid Leave', 'Paid employee leave', true),
    ('Sick Leave', 'Leave due to illness', true),
    ('Unpaid Leave', 'Leave without salary', true),
    ('Casual Leave', 'Short-term casual leave', true)
ON CONFLICT (name) DO NOTHING;
