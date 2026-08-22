import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function testSalary() {
  console.log('=== Testing Salary ===\n');

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

  const { data: salary, error: createError } = await supabase
    .from('salary_structures')
    .insert({
      employee_id: employee.id,
      basic_salary: 50000,
      allowances: 10000,
      deductions: 5000,
      effective_from: new Date().toISOString().split('T')[0],
    })
    .select()
    .single();

  if (createError) {
    console.log('❌ Create failed:', createError.message);
  } else {
    console.log('✅ Net Salary:', salary.net_salary, '(Expected: 55000)');
  }

  console.log('\n=== Done ===');
}

testSalary().catch(console.error);