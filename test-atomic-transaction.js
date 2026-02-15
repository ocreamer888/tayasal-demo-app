/**
 * Atomic Transaction Test Script
 *
 * This script verifies that the approve_order_with_inventory_deduction
 * function works correctly in your Supabase database.
 *
 * USAGE:
 *   1. Ensure your Supabase credentials are in .env.local
 *   2. Run: node test-atomic-transaction.js
 *
 * WHAT IT TESTS:
 *   - Function exists in database
 *   - Successful approval with inventory deduction
 *   - Rollback on insufficient inventory
 *   - Permission enforcement
 *   - Invalid status handling
 *
 * WARNING: This will modify test data in your database.
 *          Use a development/test database only.
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Test data IDs (generate UUIDs - these are fixed for repeatability)
const TEST_IDS = {
  engineerId: '11111111-1111-1111-1111-111111111111',
  operatorId: '22222222-2222-2222-2222-222222222222',
  material1Id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  material2Id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  orderId: 'cccccccc-cccc-cccc-cccc-cccccccccccc'
};

// Helper to log with timestamp
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    'info': '📋',
    'success': '✅',
    'error': '❌',
    'warn': '⚠️',
    'test': '🧪'
  }[type] || '•';
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

// Helper to pause
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test 1: Verify function exists
async function testFunctionExists() {
  log('Test 1: Checking if function exists...', 'test');

  const { data, error } = await supabase.rpc('approve_order_with_inventory_deduction', {
    p_order_id: TEST_IDS.orderId,
    p_approver_id: TEST_IDS.engineerId
  });

  if (error) {
    if (error.message.includes('does not exist')) {
      log('Function NOT FOUND in database!', 'error');
      log('Please execute src/migrations/002_atomic_approval_transaction.sql in Supabase SQL Editor', 'warn');
      return false;
    }
    // Other errors are okay - function might exist but test data missing
    log(`Function likely exists (got error: ${error.message})`, 'success');
    return true;
  }

  log('Function exists and is callable', 'success');
  return true;
}

// Test 2: Clean up and setup test data
async function setupTestData() {
  log('Test 2: Setting up test data...', 'test');

  // Create test users (if not exist)
  await supabase.from('profiles').upsert({
    id: TEST_IDS.engineerId,
    role: 'engineer',
    company_name: 'Test Engineering Co',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  await supabase.from('profiles').upsert({
    id: TEST_IDS.operatorId,
    role: 'operator',
    company_name: 'Test Operator Co',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  // Create test materials (for operator)
  await supabase.from('inventory_materials').upsert({
    id: TEST_IDS.material1Id,
    user_id: TEST_IDS.operatorId,
    name: 'Cemento Portland',
    description: 'Cemento tipo I para bloques',
    unit: 'kg',
    current_quantity: 1000,
    min_quantity: 100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  await supabase.from('inventory_materials').upsert({
    id: TEST_IDS.material2Id,
    user_id: TEST_IDS.operatorId,
    name: 'Arena silica',
    description: 'Arena fina para concreto',
    unit: 'kg',
    current_quantity: 500,
    min_quantity: 50,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  // Create test order (submitted, with materials)
  await supabase.from('production_orders').upsert({
    id: TEST_IDS.orderId,
    user_id: TEST_IDS.operatorId,
    created_by_name: 'Test Operator',
    block_type: 'Ladrillo',
    block_size: '10x20x40 cm',
    quantity_produced: 500,
    production_date: new Date().toISOString().split('T')[0],
    production_shift: 'Mañana',
    status: 'submitted',
    materials_used: [
      { materialId: TEST_IDS.material1Id, quantity: 100 },
      { materialId: TEST_IDS.material2Id, quantity: 50 }
    ],
    total_cost: 15000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  log('Test data created/updated:', 'success');
  log('  - Engineer user (1111...)' , 'info');
  log('  - Operator user (2222...)', 'info');
  log('  - Materials: Cemento (1000kg), Arena (500kg)', 'info');
  log('  - Order: submitted, needs 100kg cement + 50kg sand', 'info');
}

// Check inventory state
async function checkInventory() {
  const { data } = await supabase.from('inventory_materials')
    .select('id, name, current_quantity')
    .in('id', [TEST_IDS.material1Id, TEST_IDS.material2Id]);

  return data;
}

// Check order status
async function checkOrderStatus() {
  const { data } = await supabase.from('production_orders')
    .select('status, materials_used')
    .eq('id', TEST_IDS.orderId)
    .single();

  return data;
}

// Test 3: Successful approval (atomic transaction)
async function testSuccessfulApproval() {
  log('\n========================================', 'info');
  log('Test 3: Successful Approval (Atomic)', 'test');
  log('========================================', 'info');

  // Reset: Make sure order is submitted and materials are full
  await supabase.from('production_orders')
    .update({ status: 'submitted', updated_at: new Date().toISOString() })
    .eq('id', TEST_IDS.orderId);

  await supabase.from('inventory_materials')
    .update({ current_quantity: 1000, updated_at: new Date().toISOString() })
    .eq('id', TEST_IDS.material1Id);

  await supabase.from('inventory_materials')
    .update({ current_quantity: 500, updated_at: new Date().toISOString() })
    .eq('id', TEST_IDS.material2Id);

  const beforeInventory = await checkInventory();
  log('Inventory before approval:', 'info');
  beforeInventory.forEach(m => log(`  ${m.name}: ${m.current_quantity}`, 'info'));

  // Call the atomic function
  log('Calling approve_order_with_inventory_deduction...', 'info');
  const { data: result, error } = await supabase.rpc('approve_order_with_inventory_deduction', {
    p_order_id: TEST_IDS.orderId,
    p_approver_id: TEST_IDS.engineerId
  });

  if (error) {
    log(`RPC call failed: ${error.message}`, 'error');
    return false;
  }

  log(`Result: ${JSON.stringify(result)}`, 'info');

  if (!result.success) {
    log('Approval failed', 'error');
    return false;
  }

  // Verify order status changed
  const afterOrder = await checkOrderStatus();
  if (afterOrder.status !== 'approved') {
    log(`Order status is ${afterOrder.status}, expected 'approved'`, 'error');
    return false;
  }
  log('✅ Order status: approved', 'success');

  // Verify inventory deducted
  const afterInventory = await checkInventory();
  afterInventory.forEach(m => {
    const before = beforeInventory.find(b => b.id === m.id);
    const expected = before.current_quantity - 100 - 50; // For both materials
    // Actually each material has different deduction
    const deduction = m.id === TEST_IDS.material1Id ? 100 : 50;
    const expectedQty = before.current_quantity - deduction;
    if (m.current_quantity === expectedQty) {
      log(`✅ ${m.name}: ${before.current_quantity} -> ${m.current_quantity}`, 'success');
    } else {
      log(`❌ ${m.name}: expected ${expectedQty}, got ${m.current_quantity}`, 'error');
      return false;
    }
  });

  log('✅ Test PASSED: Atomic approval succeeded', 'success');
  return true;
}

// Test 4: Rollback on insufficient inventory
async function testRollbackInsufficient() {
  log('\n========================================', 'info');
  log('Test 4: Rollback on Insufficient Inventory', 'test');
  log('========================================', 'info');

  // Reset order to submitted
  await supabase.from('production_orders')
    .update({ status: 'submitted', updated_at: new Date().toISOString() })
    .eq('id', TEST_IDS.orderId);

  // Set inventory to insufficient (only 10kg cement, need 100kg)
  await supabase.from('inventory_materials')
    .update({ current_quantity: 10, updated_at: new Date().toISOString() })
    .eq('id', TEST_IDS.material1Id);

  // Keep sand at sufficient
  await supabase.from('inventory_materials')
    .update({ current_quantity: 500, updated_at: new Date().toISOString() })
    .eq('id', TEST_IDS.material2Id);

  const beforeOrder = await checkOrderStatus();
  const beforeInventory = await checkInventory();
  log('State before failed approval:', 'info');
  log(`  Order status: ${beforeOrder.status}`, 'info');
  beforeInventory.forEach(m => log(`  ${m.name}: ${m.current_quantity}`, 'info'));

  // Try to approve (should fail)
  const { data: result } = await supabase.rpc('approve_order_with_inventory_deduction', {
    p_order_id: TEST_IDS.orderId,
    p_approver_id: TEST_IDS.engineerId
  });

  log(`Result: ${JSON.stringify(result)}`, 'info');

  // Verify rollback: order still submitted
  const afterOrder = await checkOrderStatus();
  if (afterOrder.status !== 'submitted') {
    log(`❌ Order status changed to ${afterOrder.status}, should still be 'submitted'`, 'error');
  } else {
    log('✅ Order still in submitted state (not approved)', 'success');
  }

  // Verify inventory unchanged
  const afterInventory = await checkInventory();
  let inventoryUnchanged = true;
  afterInventory.forEach(m => {
    const before = beforeInventory.find(b => b.id === m.id);
    if (m.current_quantity !== before.current_quantity) {
      log(`❌ ${m.name} changed: ${before.current_quantity} -> ${m.current_quantity}`, 'error');
      inventoryUnchanged = false;
    }
  });
  if (inventoryUnchanged) {
    log('✅ Inventory unchanged (rollback successful)', 'success');
  }

  if (result.success === false && !afterOrder.status === 'submitted' && inventoryUnchanged) {
    log('✅ Test PASSED: Transaction rolled back correctly', 'success');
    return true;
  } else {
    log('❌ Test FAILED: Invalid state', 'error');
    return false;
  }
}

// Test 5: Permission enforcement
async function testPermissionEnforcement() {
  log('\n========================================', 'info');
  log('Test 5: Permission Enforcement', 'test');
  log('========================================', 'info');

  // Make sure order is submitted
  await supabase.from('production_orders')
    .update({ status: 'submitted', updated_at: new Date().toISOString() })
    .eq('id', TEST_IDS.orderId);

  // Reset materials to sufficient
  await supabase.from('inventory_materials')
    .update({ current_quantity: 1000, updated_at: new Date().toISOString() })
    .eq('id', TEST_IDS.material1Id);

  // Try to approve as OPERATOR (should fail)
  log('Attempting approval as operator...', 'info');
  const { data: result } = await supabase.rpc('approve_order_with_inventory_deduction', {
    p_order_id: TEST_IDS.orderId,
    p_approver_id: TEST_IDS.operatorId  // operator, not engineer
  });

  log(`Result: ${JSON.stringify(result)}`, 'info');

  if (result.success === false && result.code === 'INSUFFICIENT_PERMISSIONS') {
    log('✅ Test PASSED: Operator correctly denied', 'success');
    return true;
  } else {
    log('❌ Test FAILED: Should have been denied', 'error');
    return false;
  }
}

// Test 6: Invalid status (already approved)
async function testAlreadyApproved() {
  log('\n========================================', 'info');
  log('Test 6: Already Approved', 'test');
  log('========================================', 'info');

  // Set order to approved
  await supabase.from('production_orders')
    .update({ status: 'approved', updated_at: new Date().toISOString() })
    .eq('id', TEST_IDS.orderId);

  // Reset materials
  await supabase.from('inventory_materials')
    .update({ current_quantity: 1000, updated_at: new Date().toISOString() })
    .eq('id', TEST_IDS.material1Id);

  // Try to approve again
  const { data: result } = await supabase.rpc('approve_order_with_inventory_deduction', {
    p_order_id: TEST_IDS.orderId,
    p_approver_id: TEST_IDS.engineerId
  });

  log(`Result: ${JSON.stringify(result)}`, 'info');

  if (result.success === false && result.code === 'ALREADY_APPROVED') {
    log('✅ Test PASSED: Already approved correctly rejected', 'success');
    return true;
  } else {
    log('❌ Test FAILED: Should have been rejected', 'error');
    return false;
  }
}

// Test 7: Order without materials
async function testOrderWithoutMaterials() {
  log('\n========================================', 'info');
  log('Test 7: Order Without Materials', 'test');
  log('========================================', 'info');

  // Set order to submitted with empty materials
  await supabase.from('production_orders')
    .update({
      status: 'submitted',
      materials_used: [],
      updated_at: new Date().toISOString()
    })
    .eq('id', TEST_IDS.orderId);

  // Call approval (should succeed with 0 deductions)
  const { data: result } = await supabase.rpc('approve_order_with_inventory_deduction', {
    p_order_id: TEST_IDS.orderId,
    p_approver_id: TEST_IDS.engineerId
  });

  log(`Result: ${JSON.stringify(result)}`, 'info');

  const afterOrder = await checkOrderStatus();
  if (result.success && afterOrder.status === 'approved' && result.materials_deducted === 0) {
    log('✅ Test PASSED: Order approved, 0 materials deducted', 'success');
    return true;
  } else {
    log('❌ Test FAILED', 'error');
    return false;
  }
}

// Main test runner
async function runAllTests() {
  log('\n🧪 ATOMIC TRANSACTION TEST SUITE\n', 'test');
  log('========================================\n', 'info');

  const results = {
    functionExists: false,
    successfulApproval: false,
    rollbackInsufficient: false,
    permissionEnforcement: false,
    alreadyApproved: false,
    orderWithoutMaterials: false
  };

  try {
    // Test 1: Function exists
    results.functionExists = await testFunctionExists();
    if (!results.functionExists) {
      log('\n❌ Cannot proceed without function. Please deploy migration first.', 'error');
      return results;
    }

    // Setup
    await setupTestData();
    await sleep(1000); // Give DB time

    // Run tests
    results.successfulApproval = await testSuccessfulApproval();
    await sleep(1000);

    results.rollbackInsufficient = await testRollbackInsufficient();
    await sleep(1000);

    results.permissionEnforcement = await testPermissionEnforcement();
    await sleep(1000);

    results.alreadyApproved = await testAlreadyApproved();
    await sleep(1000);

    results.orderWithoutMaterials = await testOrderWithoutMaterials();

    // Summary
    log('\n========================================', 'info');
    log('📊 TEST SUMMARY', 'test');
    log('========================================', 'info');
    Object.entries(results).forEach(([test, passed]) => {
      const icon = passed ? '✅' : '❌';
      log(`${icon} ${test}`, passed ? 'success' : 'error');
    });

    const passed = Object.values(results).filter(Boolean).length;
    const total = Object.keys(results).length;
    log(`\nScore: ${passed}/${total} tests passed`, passed === total ? 'success' : 'warn');

    if (passed === total) {
      log('\n🎉 ALL TESTS PASSED! Atomic transaction is working correctly.', 'success');
    } else {
      log('\n⚠️  Some tests failed. Review the logs above.', 'warn');
    }

  } catch (err) {
    log(`\n❌ CRITICAL ERROR: ${err.message}`, 'error');
    console.error(err);
  }

  return results;
}

// Run tests
runAllTests().then(() => {
  log('\n✅ Test suite complete\n', 'info');
  process.exit(0);
}).catch(err => {
  log(`❌ Fatal error: ${err.message}`, 'error');
  process.exit(1);
});
