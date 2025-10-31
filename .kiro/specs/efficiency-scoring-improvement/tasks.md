# Implementation Plan

- [x] 1. Implement new ratio-based efficiency calculation

- [x] 1.1 Update calculateRoutineEfficiency function with new formula

  - Implement ratio calculation: actual_time_regular_tasks / total_planned_time_regular_tasks
  - Apply conditional logic: ratio < 1 returns ratio, ratio >= 1 returns 1 - ratio
  - Focus only on regular tasks, ignore focus tasks in efficiency calculation
  - _Requirements: 1.1, 1.2, 3.1, 3.2_

- [x] 1.2 Create TaskCompletion interface and types

  - Define TypeScript interfaces for task completion data
  - Add type definitions for routine efficiency results
  - _Requirements: 3.5_

- [ ]\* 1.3 Write unit tests for ratio calculation

  - Test fast completion scenarios (ratio < 1)
  - Test slow completion scenarios (ratio >= 1)
  - Test edge cases like no regular tasks, zero planned time
  - _Requirements: 1.1, 1.2, 3.1, 3.2_

- [x] 2. Implement Grace System for overall efficiency rating

- [x] 2.1 Create calculateOverallEfficiency function

  - Calculate average efficiency from past 30 days routine scores
  - Count routines with negative efficiency ratings
  - Apply Grace System penalty logic based on negative routine count
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 2.2 Implement Grace System penalty calculation

  - If ≤ 3 negative routines: no penalty
  - If ≥ 4 negative routines: penalty = 2 × sum of all negative efficiency scores
  - Apply penalty to average efficiency for final rating
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ]\* 2.3 Write unit tests for Grace System

  - Test scenarios with ≤ 3 negative routines (no penalty)
  - Test scenarios with ≥ 4 negative routines (penalty applied)
  - Test edge cases like all positive scores, extreme penalties
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 3. Update efficiency statistics fetching and calculation

- [x] 3.1 Modify fetchUserEfficiencyStats function

  - Update to use new ratio-based calculation for individual routines
  - Integrate Grace System calculation for overall user rating
  - Return Grace System breakdown for transparency

  - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.5_

- [x] 3.2 Update efficiency percentage calculation in routine completion

  - Modify routine completion logic to use new formula
  - Ensure focus tasks are excluded from efficiency calculation
  - Store calculated efficiency using ratio-based approach
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.2_

- [x] 4. Update test scenarios and validation

- [x] 4.1 Update efficiencyFormulaValidator with new test scenarios

  - Add test case for your example: 3×(10min→8min) + 1×(10min→12min focus)
  - Add test case for slow regular tasks scenario
  - _Requirements: 1.5, 2.1, 2.2, 3.4_

  - _Requirements: 1.5, 2.1, 2.2, 3.4_

- [x] 4.2 Update testEfficiencyFormulas to validate new calculations

  - Ensure new formula produces expected results for test scenarios
  - Validate Grace System calculations work correctly
  - _Requirements: 1.5, 3.4_

- [ ] 5. Integration and UI updates

- [x] 5.1 Update routine completion flow in Index.tsx

  - Modify routine completion to use new efficiency calculation
  - Ensure proper task type handling (regular vs focus)
  - _Requirements: 1.1, 1.2, 3.1, 3.2_

- [ ] 5.2 Update efficiency display components

  - Show Grace System penalty information if applicable
  - Display efficiency breakdown for user transparency
  - Update belt ranking display with new efficiency scores
  - _Requirements: 2.1, 2.2, 3.5_

-

- [ ]\* 5.3 Write integration tests
  - Test end-to-end routine completion with new efficiency calculation
  - Test Grace System integration with UI components
  - Validate efficiency badge updates reflect new scoring
  - _Requirements: 1.5, 2.4, 3.4_
