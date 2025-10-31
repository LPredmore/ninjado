/**
 * Utility for validating the efficiency calculation formula
 * Contains test scenarios to ensure the formula produces expected results
 */

import { calculateRoutineEfficiency, calculateOverallEfficiency, type TaskCompletion } from './efficiencyUtils';

export interface TestScenario {
  name: string;
  tasks: TaskCompletion[];
  expectedEfficiency: number | null;
  description: string;
}

export interface GraceSystemTestScenario {
  name: string;
  routineEfficiencies: number[];
  expectedAverageEfficiency: number;
  expectedGraceSystemPenalty: number;
  expectedFinalEfficiency: number;
  expectedNegativeRoutineCount: number;
  description: string;
}

// Test scenarios from the design document using new ratio-based formula
export const TEST_SCENARIOS: TestScenario[] = [
  {
    name: "Scenario 1: Fast Regular Tasks (Your Example)",
    description: "3 regular tasks: 10 min planned, 8 min actual each. 1 focus task ignored.",
    tasks: [
      { type: 'regular', plannedDuration: 600, actualDuration: 480 }, // 10 min planned, 8 min actual
      { type: 'regular', plannedDuration: 600, actualDuration: 480 }, // 10 min planned, 8 min actual
      { type: 'regular', plannedDuration: 600, actualDuration: 480 }, // 10 min planned, 8 min actual
      { type: 'focus', plannedDuration: 600, actualDuration: 720 },   // 10 min planned, 12 min actual (ignored)
    ],
    expectedEfficiency: 0.8, // ratio = 24min/30min = 0.8, since < 1, efficiency = 0.8
  },
  {
    name: "Scenario 2: Slow Regular Tasks",
    description: "2 regular tasks: 10 min planned, 12 min actual each. Focus task ignored.",
    tasks: [
      { type: 'regular', plannedDuration: 600, actualDuration: 720 }, // 10 min planned, 12 min actual
      { type: 'regular', plannedDuration: 600, actualDuration: 720 }, // 10 min planned, 12 min actual
      { type: 'focus', plannedDuration: 900, actualDuration: 600 },   // 15 min planned, 10 min actual (ignored)
    ],
    expectedEfficiency: -0.2, // ratio = 24min/20min = 1.2, since >= 1, efficiency = 1 - 1.2 = -0.2
  },
  {
    name: "Scenario 3: Only Focus Tasks",
    description: "Only focus tasks, should return null efficiency",
    tasks: [
      { type: 'focus', plannedDuration: 600, actualDuration: 480 },   // 10 min planned, 8 min actual
      { type: 'focus', plannedDuration: 900, actualDuration: 1200 },  // 15 min planned, 20 min actual
    ],
    expectedEfficiency: null, // No regular tasks, should return null
  },
];

// Grace System test scenarios from the design document
export const GRACE_SYSTEM_TEST_SCENARIOS: GraceSystemTestScenario[] = [
  {
    name: "Grace System Example: 5 Negative Routines",
    description: "5 routines with negative efficiency, should apply penalty",
    routineEfficiencies: [-0.10, -0.05, -0.15, -0.08, -0.12], // -10%, -5%, -15%, -8%, -12%
    expectedAverageEfficiency: -0.10, // (-10 + -5 + -15 + -8 + -12) / 5 = -10%
    expectedNegativeRoutineCount: 5,
    expectedGraceSystemPenalty: 1.0, // 2 × |(-0.50)| = 1.0 (100%)
    expectedFinalEfficiency: -1.10, // -10% + (-100%) = -110%
  },
  {
    name: "Grace System Forgiveness: 3 Negative Routines",
    description: "3 routines with negative efficiency, should not apply penalty",
    routineEfficiencies: [-0.05, -0.10, -0.08], // -5%, -10%, -8%
    expectedAverageEfficiency: -0.0767, // (-5 + -10 + -8) / 3 = -7.67%
    expectedNegativeRoutineCount: 3,
    expectedGraceSystemPenalty: 0, // No penalty (≤ 3 negative routines)
    expectedFinalEfficiency: -0.0767, // -7.67% (no penalty applied)
  },
  {
    name: "Grace System: Mixed Positive and Negative",
    description: "Mix of positive and negative routines with 4 negative (penalty applied)",
    routineEfficiencies: [0.20, -0.10, 0.15, -0.05, -0.08, 0.25, -0.12], // 20%, -10%, 15%, -5%, -8%, 25%, -12%
    expectedAverageEfficiency: 0.0357, // (20 + -10 + 15 + -5 + -8 + 25 + -12) / 7 = 3.57%
    expectedNegativeRoutineCount: 4,
    expectedGraceSystemPenalty: 0.70, // 2 × |(-0.35)| = 0.70 (70%)
    expectedFinalEfficiency: -0.6643, // 3.57% + (-70%) = -66.43%
  },
  {
    name: "Grace System: All Positive Routines",
    description: "All positive efficiency scores, no penalty",
    routineEfficiencies: [0.20, 0.15, 0.30, 0.10, 0.25], // 20%, 15%, 30%, 10%, 25%
    expectedAverageEfficiency: 0.20, // (20 + 15 + 30 + 10 + 25) / 5 = 20%
    expectedNegativeRoutineCount: 0,
    expectedGraceSystemPenalty: 0, // No negative routines, no penalty
    expectedFinalEfficiency: 0.20, // 20% (no penalty applied)
  },
];

/**
 * Validate the efficiency calculation formula against target scenarios
 */
export function validateFormula(): boolean {
  console.log("=== Validating New Ratio-Based Efficiency Formula ===\n");

  let allPassed = true;

  for (const scenario of TEST_SCENARIOS) {
    console.log(`--- ${scenario.name} ---`);
    console.log(`Description: ${scenario.description}`);
    
    const result = calculateRoutineEfficiency(scenario.tasks);
    
    console.log(`Calculated Efficiency: ${result.efficiency?.toFixed(3) ?? 'null'}`);
    console.log(`Expected Efficiency: ${scenario.expectedEfficiency?.toFixed(3) ?? 'null'}`);
    
    let passed = false;
    if (result.efficiency === null && scenario.expectedEfficiency === null) {
      passed = true;
      console.log('PASS - Both null as expected');
    } else if (result.efficiency !== null && scenario.expectedEfficiency !== null) {
      const accuracy = Math.abs(result.efficiency - scenario.expectedEfficiency);
      passed = accuracy < 0.001; // Allow 0.001 tolerance for floating point precision
      console.log(`Accuracy: ${accuracy.toFixed(6)} - ${passed ? 'PASS' : 'FAIL'}`);
    } else {
      console.log('FAIL - Null mismatch');
    }
    
    if (!passed) allPassed = false;
    
    console.log(`Breakdown:`);
    console.log(`  Total Regular Actual: ${result.breakdown.totalRegularActual}s`);
    console.log(`  Total Regular Planned: ${result.breakdown.totalRegularPlanned}s`);
    console.log(`  Ratio: ${result.breakdown.ratio.toFixed(3)}`);
    console.log(`  Is Faster Than Planned: ${result.breakdown.isFasterThanPlanned}`);
    console.log();
  }

  console.log(`=== Overall Result: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'} ===`);
  return allPassed;
}

/**
 * Validate the Grace System calculation against target scenarios
 */
export function validateGraceSystem(): boolean {
  console.log("=== Validating Grace System Calculation ===\n");

  let allPassed = true;

  for (const scenario of GRACE_SYSTEM_TEST_SCENARIOS) {
    console.log(`--- ${scenario.name} ---`);
    console.log(`Description: ${scenario.description}`);
    
    const result = calculateOverallEfficiency(scenario.routineEfficiencies);
    
    console.log(`Calculated Average Efficiency: ${result.averageEfficiency.toFixed(4)}`);
    console.log(`Expected Average Efficiency: ${scenario.expectedAverageEfficiency.toFixed(4)}`);
    
    console.log(`Calculated Grace System Penalty: ${result.graceSystemPenalty.toFixed(4)}`);
    console.log(`Expected Grace System Penalty: ${scenario.expectedGraceSystemPenalty.toFixed(4)}`);
    
    console.log(`Calculated Final Efficiency: ${result.finalEfficiency.toFixed(4)}`);
    console.log(`Expected Final Efficiency: ${scenario.expectedFinalEfficiency.toFixed(4)}`);
    
    console.log(`Calculated Negative Routine Count: ${result.negativeRoutineCount}`);
    console.log(`Expected Negative Routine Count: ${scenario.expectedNegativeRoutineCount}`);
    
    // Check all values with tolerance for floating point precision
    const avgAccuracy = Math.abs(result.averageEfficiency - scenario.expectedAverageEfficiency);
    const penaltyAccuracy = Math.abs(result.graceSystemPenalty - scenario.expectedGraceSystemPenalty);
    const finalAccuracy = Math.abs(result.finalEfficiency - scenario.expectedFinalEfficiency);
    const countMatch = result.negativeRoutineCount === scenario.expectedNegativeRoutineCount;
    
    const tolerance = 0.001;
    const passed = avgAccuracy < tolerance && 
                   penaltyAccuracy < tolerance && 
                   finalAccuracy < tolerance && 
                   countMatch;
    
    console.log(`Accuracies - Avg: ${avgAccuracy.toFixed(6)}, Penalty: ${penaltyAccuracy.toFixed(6)}, Final: ${finalAccuracy.toFixed(6)}, Count: ${countMatch ? 'MATCH' : 'MISMATCH'}`);
    console.log(`Result: ${passed ? 'PASS' : 'FAIL'}`);
    
    if (!passed) allPassed = false;
    console.log();
  }

  console.log(`=== Grace System Result: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'} ===`);
  return allPassed;
}

/**
 * Run all validation tests (formula + Grace System)
 */
export function validateAll(): boolean {
  const formulaResult = validateFormula();
  const graceSystemResult = validateGraceSystem();
  
  console.log("\n=== COMPLETE VALIDATION SUMMARY ===");
  console.log(`Formula Tests: ${formulaResult ? 'PASSED' : 'FAILED'}`);
  console.log(`Grace System Tests: ${graceSystemResult ? 'PASSED' : 'FAILED'}`);
  console.log(`Overall: ${formulaResult && graceSystemResult ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  
  return formulaResult && graceSystemResult;
}