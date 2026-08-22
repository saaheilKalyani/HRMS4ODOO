import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLeaveApproval() {
  console.log('=== Testing Leave Approval Transaction ===\n');

  // Step 1: Get an employee
  const { data: employee, error: empError } = await supabase
    .from('employees')
    .select('id, full_name')
    .limit(1)
    .single();

  if (empError || !employee) {
    console.log('❌ No employees found');
    return;
  }
  console.log('✅ Employee:', employee.full_name);

  // Step 2: Get a leave type
  const { data: leaveType, error: typeError } = await supabase
    .from('leave_types')
    .select('id, name')
    .limit(1)
    .single();

  if (typeError || !leaveType) {
    console.log('❌ No leave types found. Run seed data first.');
    return;
  }
  console.log('✅ Leave Type:', leaveType.name);

  // Step 3: Create a leave request (3 days)
  console.log('\n--- Create Leave Request (3 days) ---');
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() + 10);
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 12);

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  const { data: leaveRequest, error: createError } = await supabase
    .from('leave_requests')
    .insert({
      employee_id: employee.id,
      leave_type_id: leaveType.id,
      start_date: startDateStr,
      end_date: endDateStr,
      reason: 'Test 3-day leave approval',
      status: 'Pending',
    })
    .select()
    .single();

  if (createError || !leaveRequest) {
    console.log('❌ Create leave request failed:', createError?.message);
    return;
  }
  console.log('✅ Leave request created:');
  console.log('   ID:', leaveRequest.id);
  console.log('   Dates:', leaveRequest.start_date, 'to', leaveRequest.end_date);
  console.log('   Status:', leaveRequest.status);

  // Step 4: Approve the leave via RPC
  console.log('\n--- Approve Leave (RPC Transaction) ---');
  const { error: approveError } = await supabase.rpc('approve_leave', {
    p_leave_request_id: leaveRequest.id,
    p_comment: 'Approved for testing',
  });

  if (approveError) {
    console.log('❌ Approval failed:', approveError.message);
    return;
  }
  console.log('✅ RPC approve_leave executed successfully');

  // Step 5: Verify leave_requests.status = Approved
  console.log('\n--- Verify Leave Request Status ---');
  const { data: updatedRequest, error: requestError } = await supabase
    .from('leave_requests')
    .select('status')
    .eq('id', leaveRequest.id)
    .single();

  if (requestError) {
    console.log('❌ Failed to fetch request:', requestError.message);
  } else {
    console.log('✅ Leave Request Status:', updatedRequest.status);
    console.log('   Expected: Approved');
    console.log('   Match:', updatedRequest.status === 'Approved' ? '✅' : '❌');
  }

  // Step 6: Verify leave_approvals exists
  console.log('\n--- Verify Leave Approval Record ---');
  const { data: approval, error: approvalError } = await supabase
    .from('leave_approvals')
    .select('*')
    .eq('leave_request_id', leaveRequest.id)
    .single();

  if (approvalError || !approval) {
    console.log('❌ Approval record not found');
  } else {
    console.log('✅ Approval record exists:');
    console.log('   Decision:', approval.decision);
    console.log('   Comment:', approval.comment);
    console.log('   Match:', approval.decision === 'Approved' ? '✅' : '❌');
  }

  // Step 7: Verify attendance records created
  console.log('\n--- Verify Attendance Records (3 days) ---');
  const { data: attendanceRecords, error: attError } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('employee_id', employee.id)
    .gte('attendance_date', startDateStr)
    .lte('attendance_date', endDateStr)
    .order('attendance_date', { ascending: true });

  if (attError) {
    console.log('❌ Failed to fetch attendance:', attError.message);
  } else {
    console.log(`✅ Found ${attendanceRecords.length} attendance records`);
    console.log('   Expected: 3');
    console.log('   Match:', attendanceRecords.length === 3 ? '✅' : '❌');

    attendanceRecords.forEach((record) => {
      console.log(`\n   Date: ${record.attendance_date}`);
      console.log(`   Status: ${record.status}`);
      console.log(`   Check-in: ${record.check_in ?? 'NULL'}`);
      console.log(`   Check-out: ${record.check_out ?? 'NULL'}`);
      console.log(`   Status Match: ${record.status === 'Leave' ? '✅' : '❌'}`);
      console.log(`   Check-in NULL: ${record.check_in === null ? '✅' : '❌'}`);
      console.log(`   Check-out NULL: ${record.check_out === null ? '✅' : '❌'}`);
    });
  }

  // Step 8: Test double approval (should fail)
  console.log('\n--- Test Double Approval (should fail) ---');
  const { error: doubleApproveError } = await supabase.rpc('approve_leave', {
    p_leave_request_id: leaveRequest.id,
    p_comment: 'Trying to approve again',
  });

  if (doubleApproveError) {
    console.log('✅ Double approval blocked:', doubleApproveError.message);
  } else {
    console.log('❌ Double approval was allowed!');
  }

  console.log('\n=== Test Complete ===');
}

testLeaveApproval().catch(console.error);