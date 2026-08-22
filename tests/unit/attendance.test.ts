import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

// Get credentials from .env or hardcode them
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://YOUR_PROJECT_ID.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAttendance() {
  console.log('=== Testing Attendance ===\n');

  // Sign in
  console.log('Signing in...');
  const { data: session, error: sessionError } = await supabase.auth.signInWithPassword({
    email: 'YOUR_EMAIL@example.com',  // ← CHANGE THIS
    password: 'YOUR_PASSWORD',         // ← CHANGE THIS
  });

  if (sessionError) {
    console.log('❌ Sign in failed:', sessionError.message);
    console.log('Update email/password in the test file.');
    return;
  }
  console.log('✅ Signed in as:', session.user.email);

  // Get employee
  const { data: employee, error: empError } = await supabase
    .from('employees')
    .select('id, full_name, employee_code')
    .eq('profile_id', session.user.id)
    .single();

  if (empError || !employee) {
    console.log('❌ No employee record found for this user.');
    return;
  }
  console.log('✅ Employee:', employee.full_name, `(${employee.employee_code})`);

  const today = new Date().toISOString().split('T')[0];
  console.log('📅 Today:', today);

  // Test 1: Check-In
  console.log('\n--- Test 1: Check-In ---');
  const { data: checkInData, error: checkInError } = await supabase
    .from('attendance_records')
    .insert({
      employee_id: employee.id,
      attendance_date: today,
      check_in: new Date().toISOString(),
      status: 'Present',
    })
    .select()
    .single();

  if (checkInError) {
    console.log('❌ Check-in failed:', checkInError.message);
  } else {
    console.log('✅ Check-in successful');
    console.log('   Time:', checkInData.check_in);
  }

  // Test 2: Duplicate Check-In
  console.log('\n--- Test 2: Duplicate Check-In ---');
  const { data: dupData, error: dupError } = await supabase
    .from('attendance_records')
    .insert({
      employee_id: employee.id,
      attendance_date: today,
      check_in: new Date().toISOString(),
      status: 'Present',
    })
    .select()
    .single();

  if (dupError) {
    console.log('✅ Duplicate blocked:', dupError.message);
  } else {
    console.log('❌ Duplicate was allowed! UNIQUE constraint not working.');
  }

  // Test 3: Check-Out
  console.log('\n--- Test 3: Check-Out ---');
  const { data: checkOutData, error: checkOutError } = await supabase
    .from('attendance_records')
    .update({ check_out: new Date().toISOString() })
    .eq('employee_id', employee.id)
    .eq('attendance_date', today)
    .select()
    .single();

  if (checkOutError) {
    console.log('❌ Check-out failed:', checkOutError.message);
  } else {
    console.log('✅ Check-out successful');
    console.log('   Time:', checkOutData.check_out);
    console.log('   Total hours:', checkOutData.total_hours);
  }

  // Test 4: Get My Attendance
  console.log('\n--- Test 4: My Attendance History ---');
  const { data: myRecords, error: myError } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('employee_id', employee.id)
    .order('attendance_date', { ascending: false })
    .limit(5);

  if (myError) {
    console.log('❌ Failed:', myError.message);
  } else {
    console.log(`✅ Found ${myRecords.length} records`);
    myRecords.forEach((r) => {
      console.log(`   ${r.attendance_date} | ${r.status} | ${r.total_hours ?? 'N/A'} hrs`);
    });
  }

  console.log('\n=== Test Complete ===');
}

testAttendance().catch(console.error);