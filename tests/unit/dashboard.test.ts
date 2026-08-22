import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function testDashboard() {
  console.log('=== Testing Dashboard Data ===\n');

  const today = new Date().toISOString().split('T')[0];

  const { count: totalEmployees } = await supabase
    .from('employees')
    .select('id', { count: 'exact' })
    .eq('employment_status', 'Active');

  console.log('✅ Total Employees:', totalEmployees);

  const { count: presentEmployees } = await supabase
    .from('attendance_records')
    .select('id', { count: 'exact' })
    .eq('attendance_date', today)
    .eq('status', 'Present');

  console.log('✅ Present Today:', presentEmployees);

  const { count: pendingLeaveRequests } = await supabase
    .from('leave_requests')
    .select('id', { count: 'exact' })
    .eq('status', 'Pending');

  console.log('✅ Pending Leave Requests:', pendingLeaveRequests);

  console.log('\n=== Done ===');
}

testDashboard().catch(console.error);