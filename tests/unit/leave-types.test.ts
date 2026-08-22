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

async function testLeaveTypes() {
  console.log('=== Testing Leave Types ===\n');

  // Test 1: Get all active leave types
  console.log('--- Test 1: Get Active Leave Types ---');
  const { data: leaveTypes, error } = await supabase
    .from('leave_types')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.log('❌ Failed:', error.message);
    console.log('\nMake sure you have:');
    console.log('1. Run the migration SQL for leave_types table');
    console.log('2. Seed data inserted');
    return;
  }

  console.log(`✅ Found ${leaveTypes.length} active leave types\n`);
  leaveTypes.forEach((lt) => {
    console.log(`   ID: ${lt.id}`);
    console.log(`   Name: ${lt.name}`);
    console.log(`   Description: ${lt.description ?? 'N/A'}`);
    console.log(`   Active: ${lt.is_active}`);
    console.log('   ---');
  });

  // Test 2: Verify frozen P0 values
  console.log('\n--- Test 2: Verify Seed Data ---');
  const expectedTypes = ['Paid Leave', 'Sick Leave', 'Unpaid Leave', 'Casual Leave'];
  
  expectedTypes.forEach((expected) => {
    const found = leaveTypes.some((lt) => lt.name === expected);
    console.log(`${found ? '✅' : '❌'} ${expected}`);
  });

  // Test 3: Test inactive filter (deactivate one type)
  console.log('\n--- Test 3: Deactivate and Check ---');
  
  // Deactivate "Casual Leave"
  const { error: updateError } = await supabase
    .from('leave_types')
    .update({ is_active: false })
    .eq('name', 'Casual Leave');

  if (updateError) {
    console.log('❌ Deactivate failed:', updateError.message);
  } else {
    console.log('✅ Deactivated "Casual Leave"');
  }

  // Check active types again
  const { data: activeTypes, error: activeError } = await supabase
    .from('leave_types')
    .select('*')
    .eq('is_active', true);

  if (activeError) {
    console.log('❌ Fetch failed:', activeError.message);
  } else {
    console.log(`✅ Active types now: ${activeTypes.length}`);
    activeTypes.forEach((lt) => {
      console.log(`   ${lt.name}`);
    });
  }

  // Reactivate
  const { error: reactivateError } = await supabase
    .from('leave_types')
    .update({ is_active: true })
    .eq('name', 'Casual Leave');

  if (reactivateError) {
    console.log('❌ Reactivate failed:', reactivateError.message);
  } else {
    console.log('✅ Reactivated "Casual Leave"');
  }

  // Test 4: Get single leave type by ID
  console.log('\n--- Test 4: Get Leave Type by ID ---');
  if (leaveTypes.length > 0) {
    const firstType = leaveTypes[0];
    const { data: singleType, error: singleError } = await supabase
      .from('leave_types')
      .select('*')
      .eq('id', firstType.id)
      .single();

    if (singleError) {
      console.log('❌ Failed:', singleError.message);
    } else {
      console.log(`✅ Found: ${singleType.name}`);
    }
  }

  // Test 5: Check unique constraint
  console.log('\n--- Test 5: Duplicate Name (should fail) ---');
  const { error: dupError } = await supabase
    .from('leave_types')
    .insert({
      name: 'Paid Leave',
      description: 'Duplicate test',
      is_active: true,
    });

  if (dupError) {
    console.log('✅ Duplicate blocked:', dupError.message);
  } else {
    console.log('❌ Duplicate was allowed! Unique constraint missing.');
    // Clean up if duplicate was created
    await supabase.from('leave_types').delete().eq('name', 'Paid Leave').neq('description', 'Paid time off');
  }

  console.log('\n=== Test Complete ===');
}

testLeaveTypes().catch(console.error);