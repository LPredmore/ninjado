/**
 * Test utilities for efficiency calculation formulas
 * This file provides testing functions to validate the formula implementation
 * Updated to validate new ratio-based calculations and Grace System
 */

import { validateFormula, validateGraceSystem, validateAll, TEST_SCENARIOS, GRACE_SYSTEM_TEST_SCENARIOS } from './efficiencyFormulaValidator';
import { calculateRoutineEfficiency, calculateOverallEfficiency } from './efficiencyUtils';

/**
 * Run validation tests for the efficiency formula
 * This ensures the new ratio-based formula produces the expected results for target scenarios
 */
export function runFormulaValidation(): boolean {
  console.log("=== Testing New Ratio-Based Efficiency Formula ===");
  return validateFormula();
}

/**
 * Run validation tests for the Grace System
 * This ensures the Grace System penalty calculation works correctly
 */
export function runGraceSystemValidation(): boolean {
  console.log("=== Testing Grace System Calculation ===");
  return validateGraceSystem();
}

/**
 * Run all validation tests (formula + Grace System)
 * This ensures both the efficiency formula and Grace System work correctly
 */
export function runAllValidation(): boolean {
  console.log("=== Running Complete Validation Suite ===");
  return validateAll();
}

/**
 * Test specific scenario: Your example from design document
 * 3×(10min→8min) + 1×(10min→12min focus)
 * Expected: ratio = 24min/30min = 0.8, efficiency = 0.8 (80%)
 */
export function testYourExample(): boolean {
  console.log("=== Testing Your Example Scenario ===");
  
  const tasks = [
    { type: 'regular' as const, plannedDuration: 600, actualDuration: 480 }, // 10→8 min
    { type: 'regular' as const, plannedDuration: 600, actualDuration: 480 }, // 10→8 min
    { type: 'regular' as const, plannedDuration: 600, actualDuration: 480 }, // 10→8 min
    { type: 'focus' as const, plannedDuration: 600, actualDuration: 720 },   // 10→12 min (ignored)
  ];
  
  const result = calculateRoutineEfficiency(tasks);
  const expected = 0.8;
  
  console.log(`Calculated efficiency: ${result.efficiency}`);
  console.log(`Expected efficiency: ${expected}`);
  console.log(`Breakdown:`);
  console.log(`  Total Regular Actual: ${result.breakdown.totalRegularActual}s (${result.breakdown.totalRegularActual/60} min)`);
  console.log(`  Total Regular Planned: ${result.breakdown.totalRegularPlanned}s (${result.breakdown.totalRegularPlanned/60} min)`);
  console.log(`  Ratio: ${result.breakdown.ratio}`);
  console.log(`  Is Faster Than Planned: ${result.breakdown.isFasterThanPlanned}`);
  
  const passed = result.efficiency !== null && Math.abs(result.efficiency - expected) < 0.001;
  console.log(`Result: ${passed ? 'PASS' : 'FAIL'}`);
  
  return passed;
}

/**
 * Test specific scenario: Slow regular tasks
 * 2×(10min→12min) + 1×(15min→10min focus)
 * Expected: ratio = 24min/20min = 1.2, efficiency = 1 - 1.2 = -0.2 (-20%)
 */
export function testSlowRegularTasks(): boolean {
  console.log("=== Testing Slow Regular Tasks Scenario ===");
  
  const tasks = [
    { type: 'regular' as const, plannedDuration: 600, actualDuration: 720 }, // 10→12 min
    { type: 'regular' as const, plannedDuration: 600, actualDuration: 720 }, // 10→12 min
    { type: 'focus' as const, plannedDuration: 900, actualDuration: 600 },   // 15→10 min (ignored)
  ];
  
  const result = calculateRoutineEfficiency(tasks);
  const expected = -0.2;
  
  console.log(`Calculated efficiency: ${result.efficiency}`);
  console.log(`Expected efficiency: ${expected}`);
  console.log(`Breakdown:`);
  console.log(`  Total Regular Actual: ${result.breakdown.totalRegularActual}s (${result.breakdown.totalRegularActual/60} min)`);
  console.log(`  Total Regular Planned: ${result.breakdown.totalRegularPlanned}s (${result.breakdown.totalRegularPlanned/60} min)`);
  console.log(`  Ratio: ${result.breakdown.ratio}`);
  console.log(`  Is Faster Than Planned: ${result.breakdown.isFasterThanPlanned}`);
  
  const passed = result.efficiency !== null && Math.abs(result.efficiency - expected) < 0.001;
  console.log(`Result: ${passed ? 'PASS' : 'FAIL'}`);
  
  return passed;
}

/**
 * Test Grace System with penalty scenario
 * 5 negative routines: -10%, -5%, -15%, -8%, -12%
 * Expected: avg = -10%, penalty = 100%, final = -110%
 */
export function testGraceSystemPenalty(): boolean {
  console.log("=== Testing Grace System Penalty Scenario ===");
  
  const routineEfficiencies = [-0.10, -0.05, -0.15, -0.08, -0.12];
  const result = calculateOverallEfficiency(routineEfficiencies);
  
  const expectedAvg = -0.10;
  const expectedPenalty = 1.0; // 2 × |(-0.50)| = 1.0
  const expectedFinal = -1.10;
  const expectedNegativeCount = 5;
  
  console.log(`Calculated Average: ${result.averageEfficiency.toFixed(4)}`);
  console.log(`Expected Average: ${expectedAvg.toFixed(4)}`);
  console.log(`Calculated Penalty: ${result.graceSystemPenalty.toFixed(4)}`);
  console.log(`Expected Penalty: ${expectedPenalty.toFixed(4)}`);
  console.log(`Calculated Final: ${result.finalEfficiency.toFixed(4)}`);
  console.log(`Expected Final: ${expectedFinal.toFixed(4)}`);
  console.log(`Negative Count: ${result.negativeRoutineCount} (expected: ${expectedNegativeCount})`);
  
  const avgAccuracy = Math.abs(result.averageEfficiency - expectedAvg);
  const penaltyAccuracy = Math.abs(result.graceSystemPenalty - expectedPenalty);
  const finalAccuracy = Math.abs(result.finalEfficiency - expectedFinal);
  const countMatch = result.negativeRoutineCount === expectedNegativeCount;
  
  const tolerance = 0.001;
  const passed = avgAccuracy < tolerance && 
                 penaltyAccuracy < tolerance && 
                 finalAccuracy < tolerance && 
                 countMatch;
  
  console.log(`Result: ${passed ? 'PASS' : 'FAIL'}`);
  
  return passed;
}

/**
 * Test Grace System forgiveness scenario
 * 3 negative routines: -5%, -10%, -8%
 * Expected: avg = -7.67%, penalty = 0%, final = -7.67%
 */
export function testGraceSystemForgiveness(): boolean {
  console.log("=== Testing Grace System Forgiveness Scenario ===");
  
  const routineEfficiencies = [-0.05, -0.10, -0.08];
  const result = calculateOverallEfficiency(routineEfficiencies);
  
  const expectedAvg = -0.0767; // (-5 + -10 + -8) / 3 = -7.67%
  const expectedPenalty = 0; // No penalty (≤ 3 negative routines)
  const expectedFinal = -0.0767;
  const expectedNegativeCount = 3;
  
  console.log(`Calculated Average: ${result.averageEfficiency.toFixed(4)}`);
  console.log(`Expected Average: ${expectedAvg.toFixed(4)}`);
  console.log(`Calculated Penalty: ${result.graceSystemPenalty.toFixed(4)}`);
  console.log(`Expected Penalty: ${expectedPenalty.toFixed(4)}`);
  console.log(`Calculated Final: ${result.finalEfficiency.toFixed(4)}`);
  console.log(`Expected Final: ${expectedFinal.toFixed(4)}`);
  console.log(`Negative Count: ${result.negativeRoutineCount} (expected: ${expectedNegativeCount})`);
  
  const avgAccuracy = Math.abs(result.averageEfficiency - expectedAvg);
  const penaltyAccuracy = Math.abs(result.graceSystemPenalty - expectedPenalty);
  const finalAccuracy = Math.abs(result.finalEfficiency - expectedFinal);
  const countMatch = result.negativeRoutineCount === expectedNegativeCount;
  
  const tolerance = 0.001;
  const passed = avgAccuracy < tolerance && 
                 penaltyAccuracy < tolerance && 
                 finalAccuracy < tolerance && 
                 countMatch;
  
  console.log(`Result: ${passed ? 'PASS' : 'FAIL'}`);
  
  return passed;
}

/**
 * Run comprehensive test suite for new efficiency calculations
 * Tests both individual scenarios and the complete validation suite
 */
export function runComprehensiveTests(): boolean {
  console.log("=== Running Comprehensive Test Suite ===\n");
  
  const tests = [
    { name: "Your Example", test: testYourExample },
    { name: "Slow Regular Tasks", test: testSlowRegularTasks },
    { name: "Grace System Penalty", test: testGraceSystemPenalty },
    { name: "Grace System Forgiveness", test: testGraceSystemForgiveness },
  ];
  
  let allPassed = true;
  const results: { name: string; passed: boolean }[] = [];
  
  for (const { name, test } of tests) {
    console.log(`\n--- ${name} ---`);
    const passed = test();
    results.push({ name, passed });
    if (!passed) allPassed = false;
  }
  
  console.log("\n=== Individual Test Results ===");
  for (const { name, passed } of results) {
    console.log(`${name}: ${passed ? 'PASS' : 'FAIL'}`);
  }
  
  console.log("\n=== Running Complete Validation Suite ===");
  const validationPassed = runAllValidation();
  
  const overallPassed = allPassed && validationPassed;
  
  console.log("\n=== COMPREHENSIVE TEST SUMMARY ===");
  console.log(`Individual Tests: ${allPassed ? 'PASSED' : 'FAILED'}`);
  console.log(`Validation Suite: ${validationPassed ? 'PASSED' : 'FAILED'}`);
  console.log(`Overall Result: ${overallPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  
  return overallPassed;
}