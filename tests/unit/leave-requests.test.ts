import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables');
  console.error('Check your .env file has:');
  console.error('VITE_SUPABASE_URL=...');
  console.error('VITE_SUPABASE_ANON_KEY=...');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLeaveRequests() {
  console.log('=== Testing Leave Requests ===\n');

  // Step 1: Sign in as employee
  console.log('--- Step 1: Sign In ---');
  const { data: session, error: sessionError } = await supabase.auth.signInWithPassword({
    email: 'nishant.cipher@gmail.com',  // ← CHANGE THIS
    password: 'Miakhalifa@2208',         // ← CHANGE THIS
  });

  if (sessionError) {
    console.log('❌ Sign in failed:', sessionError.message);
    console.log('Update email/password in this test file.');
    return;
  }
  console.log('✅ Signed in as:', session.user.email);

  // Step 2: Get employee record
  console.log('\n--- Step 2: Get Employee ---');
  const { data: employee, error: empError } = await supabase
    .from('employees')
    .select('id, full_name, employee_code')
    .eq('profile_id', session.user.id)
    .single();

  if (empError || !employee) {
    console.log('❌ No employee record found.');
    return;
  }
  console.log('✅ Employee:', employee.full_name, `(${employee.employee_code})`);
  console.log('   Employee ID:', employee.id);

  // Step 3: Get leave types
  console.log('\n--- Step 3: Get Leave Types ---');
  const { data: leaveTypes, error: typesError } = await supabase
    .from('leave_types')
    .select('*')
    .eq('is_active', true)
    .limit(1);

  if (typesError || !leaveTypes || leaveTypes.length === 0) {
    console.log('❌ No leave types found. Run seed data first.');
    return;
  }
  console.log('✅ Leave type:', leaveTypes[0].name, `(${leaveTypes[0].id})`);

  // Step 4: Create leave request (Valid)
  console.log('\n--- Step 4: Create Leave Request ---');
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() + 5);
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 7);

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  const { data: newRequest, error: createError } = await supabase
    .from('leave_requests')
    .insert({
      employee_id: employee.id,
      leave_type_id: leaveTypes[0].id,
      start_date: startDateStr,
      end_date: endDateStr,
      reason: 'Test leave request',
      status: 'Pending',
    })
    .select()
    .single();

  if (createError) {
    console.log('❌ Create failed:', createError.message);
  } else {
    console.log('✅ Leave request created:');
    console.log('   ID:', newRequest.id);
    console.log('   Start:', newRequest.start_date);
    console.log('   End:', newRequest.end_date);
    console.log('   Status:', newRequest.status);
    console.log('   Reason:', newRequest.reason);
  }

  // Step 5: Test invalid dates (end before start)
  console.log('\n--- Step 5: Invalid Dates (end < start) ---');
  const invalidStart = '2026-08-25';
  const invalidEnd = '2026-08-20';

  const { error: invalidError } = await supabase
    .from('leave_requests')
    .insert({
      employee_id: employee.id,
      leave_type_id: leaveTypes[0].id,
      start_date: invalidStart,
      end_date: invalidEnd,
      status: 'Pending',
    })
    .select()
    .single();

  if (invalidError) {
    console.log('✅ Invalid dates blocked:', invalidError.message);
  } else {
    console.log('❌ Invalid dates were allowed! Constraint missing.');
  }

  // Step 6: Get my leave requests
  console.log('\n--- Step 6: Get My Leave Requests ---');
  const { data: myRequests, error: myReqError } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('employee_id', employee.id)
    .order('created_at', { ascending: false });

  if (myReqError) {
    console.log('❌ Failed:', myReqError.message);
  } else {
    console.log(`✅ Found ${myRequests.length} requests:`);
    myRequests.forEach((req) => {
      console.log(`   ${req.start_date} to ${req.end_date} | ${req.status} | ${req.reason ?? 'N/A'}`);
    });
  }

  // Step 7: Get single leave request with details
  if (newRequest) {
    console.log('\n--- Step 7: Get Single Request Details ---');
    const { data: requestDetails, error: detailsError } = await supabase
      .from('leave_requests')
      .select(`
        *,
        leave_type:leave_type_id (*)
      `)
      .eq('id', newRequest.id)
      .single();

    if (detailsError) {
      console.log('❌ Failed:', detailsError.message);
    } else {
      console.log('✅ Request details:');
      console.log('   Type:', requestDetails.leave_type?.name);
      console.log('   Status:', requestDetails.status);
      console.log('   Dates:', requestDetails.start_date, 'to', requestDetails.end_date);
    }
  }

  // Step 8: Test employee cannot access other's requests
  console.log('\n--- Step 8: Access Other Employee Request ---');
  const { data: otherRequests, error: otherError } = await supabase
    .from('leave_requests')
    .select('*')
    .neq('employee_id', employee.id)
    .limit(1);

  if (otherError) {
    console.log('✅ Blocked:', otherError.message);
  } else if (otherRequests && otherRequests.length > 0) {
    console.log('⚠️ Found other requests. RLS might not be blocking properly.');
    console.log('   Note: RLS should filter these out automatically.');
  } else {
    console.log('✅ No other requests visible (RLS working)');
  }

  console.log('\n=== Test Complete ===');
}

testLeaveRequests().catch(console.error);