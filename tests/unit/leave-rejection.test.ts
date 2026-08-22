import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLeaveRejection() {
  console.log('=== Testing Leave Rejection Transaction ===\n');

  // Get employee
  const { data: employee } = await supabase
    .from('employees')
    .select('id, full_name')
    .limit(1)
    .single();

  if (!employee) {
    console.log('❌ No employees found');
    return;
  }
  console.log('✅ Employee:', employee.full_name);

  // Get leave type
  const { data: leaveType } = await supabase
    .from('leave_types')
    .select('id, name')
    .limit(1)
    .single();

  if (!leaveType) {
    console.log('❌ No leave types found');
    return;
  }
  console.log('✅ Leave Type:', leaveType.name);

  // Create leave request
  console.log('\n--- Create Leave Request ---');
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() + 20);
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 21);

  const { data: leaveRequest, error: createError } = await supabase
    .from('leave_requests')
    .insert({
      employee_id: employee.id,
      leave_type_id: leaveType.id,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      reason: 'Test rejection',
      status: 'Pending',
    })
    .select()
    .single();

  if (createError || !leaveRequest) {
    console.log('❌ Create failed:', createError?.message);
    return;
  }
  console.log('✅ Leave request created:', leaveRequest.id);

  // Reject leave
  console.log('\n--- Reject Leave (RPC) ---');
  const { error: rejectError } = await supabase.rpc('reject_leave', {
    p_leave_request_id: leaveRequest.id,
    p_comment: 'Rejected for testing',
  });

  if (rejectError) {
    console.log('❌ Rejection failed:', rejectError.message);
    return;
  }
  console.log('✅ RPC reject_leave executed successfully');

  // Verify status
  console.log('\n--- Verify Status ---');
  const { data: updatedRequest } = await supabase
    .from('leave_requests')
    .select('status')
    .eq('id', leaveRequest.id)
    .single();

  console.log('✅ Status:', updatedRequest.status);
  console.log('   Expected: Rejected');
  console.log('   Match:', updatedRequest.status === 'Rejected' ? '✅' : '❌');

  // Verify approval record
  console.log('\n--- Verify Approval Record ---');
  const { data: approval } = await supabase
    .from('leave_approvals')
    .select('decision, comment')
    .eq('leave_request_id', leaveRequest.id)
    .single();

  if (approval) {
    console.log('✅ Decision:', approval.decision);
    console.log('   Comment:', approval.comment);
  }

  // Verify NO attendance records created
  console.log('\n--- Verify No Attendance Created ---');
  const { data: attendance } = await supabase
    .from('attendance_records')
    .select('id')
    .eq('employee_id', employee.id)
    .gte('attendance_date', leaveRequest.start_date)
    .lte('attendance_date', leaveRequest.end_date);

  if (attendance && attendance.length > 0) {
    console.log('❌ Attendance records exist (should be none)');
  } else {
    console.log('✅ No attendance records created for rejected leave');
  }

  console.log('\n=== Test Complete ===');
}

testLeaveRejection().catch(console.error);