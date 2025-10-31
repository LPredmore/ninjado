# Efficiency Scoring Improvement Design

## Overview

The new efficiency scoring system uses a ratio-based calculation focused on regular tasks only, with a Grace System for handling negative efficiency scores. The system provides intuitive scoring where faster completion yields positive scores and slower completion yields negative scores, with a penalty system for consistent poor performance.

## Architecture

### New Efficiency Formula

**Per-Routine Calculation:**
```
ratio = actual_time_regular_tasks / total_planned_time_regular_tasks

If ratio < 1 (faster than planned):
  efficiency = ratio

If ratio >= 1 (slower than planned):
  efficiency = 1 - ratio
```

**Overall User Rating:**
```
1. Calculate average of all routine efficiency scores from past 30 days
2. Apply Grace System penalty if applicable
```

### Grace System

**Penalty Rules:**
- Count routines with negative efficiency in past 30 days
- If ≤ 3 negative routines: No penalty applied
- If ≥ 4 negative routines: Apply penalty = 2 × (sum of all negative efficiency scores)

### Key Changes

1. **Focus on Regular Tasks**: Only regular tasks count toward efficiency calculation
2. **Ratio-Based Scoring**: Direct ratio comparison for intuitive results
3. **Grace System**: Forgiveness for occasional poor performance, penalty for consistent issues
4. **Focus Tasks Ignored**: Focus tasks don't impact efficiency scores

## Components and Interfaces

### Modified Functions

#### New `calculateRoutineEfficiency()`
```typescript
export function calculateRoutineEfficiency(
  tasks: Array<{
    type: 'regular' | 'focus';
    plannedDuration: number; // seconds
    actualDuration: number; // seconds
  }>
): {
  efficiency: number | null;
  breakdown: {
    totalRegularActual: number;
    totalRegularPlanned: number;
    ratio: number;
    isFasterThanPlanned: boolean;
  };
}
```

#### New `calculateOverallEfficiency()`
```typescript
export function calculateOverallEfficiency(
  routineEfficiencies: number[]
): {
  averageEfficiency: number;
  graceSystemPenalty: number;
  finalEfficiency: number;
  negativeRoutineCount: number;
}
```

#### Updated `fetchUserEfficiencyStats()`
```typescript
export async function fetchUserEfficiencyStats(
  userId: string
): Promise<{
  averageEfficiency: number | null;
  finalEfficiency: number | null;
  graceSystemPenalty: number;
  negativeRoutineCount: number;
  completionCount: number;
  currentBelt: BeltRank;
  hasEnoughData: boolean;
  last30Days: Array<RoutineCompletion>;
}>
```

### Data Flow

1. **Task Completion**: Record actual completion time for each task
2. **Regular Tasks Only**: Sum actual and planned times for regular tasks
3. **Ratio Calculation**: actual_time / planned_time
4. **Efficiency Score**: Apply formula based on ratio
5. **Overall Rating**: Average all routine scores, apply Grace System

## Data Models

### Routine Completion Data

The existing `routine_completions` table structure remains the same:

```sql
-- Existing columns
efficiency_percentage DECIMAL -- Now calculated with ratio-based formula
total_time_saved INTEGER -- Maintained for backward compatibility
total_routine_duration INTEGER -- Maintained for backward compatibility
```

### Task Completion Interface

```typescript
interface TaskCompletion {
  type: 'regular' | 'focus';
  plannedDuration: number; // seconds
  actualDuration: number; // seconds
}

interface RoutineEfficiencyResult {
  efficiency: number; // The calculated efficiency score
  breakdown: {
    totalRegularActual: number;
    totalRegularPlanned: number;
    ratio: number;
    isFasterThanPlanned: boolean;
  };
}
```

### Grace System Data

```typescript
interface GraceSystemResult {
  negativeRoutineCount: number;
  negativeEfficiencySum: number;
  penaltyApplied: number;
  finalEfficiency: number;
}
```

## Error Handling

### Edge Cases

1. **No Regular Tasks**: Return null efficiency if routine contains only focus tasks
2. **Zero Planned Time**: Return null efficiency if total planned time for regular tasks is zero
3. **Invalid Durations**: Handle negative or zero actual durations gracefully
4. **Data Migration**: Recalculate existing records with new formula

### Grace System Edge Cases

1. **Insufficient Data**: Apply Grace System only when user has routine completion data
2. **All Positive Scores**: No penalty when all efficiency scores are positive
3. **Extreme Penalties**: Consider reasonable caps on Grace System penalties

### Validation

- Ensure planned and actual durations are positive numbers
- Validate task type is either 'regular' or 'focus'
- Handle missing completion data gracefully
- Verify Grace System calculations don't produce unreasonable results

## Testing Strategy

### Unit Tests

1. **Ratio Formula**: Test ratio calculation for various scenarios
2. **Grace System**: Test penalty calculations with different negative routine counts
3. **Edge Cases**: No regular tasks, zero planned time, invalid data
4. **Data Validation**: Invalid inputs, missing completion data

### Integration Tests

1. **End-to-End Flow**: Complete routine → calculation → storage → Grace System
2. **UI Updates**: Verify efficiency badges reflect new scores
3. **Historical Data**: Ensure existing completions work with new calculation

### Test Scenarios

#### Scenario 1: Your Example - Fast Regular Tasks
- 3 regular tasks: 10 min planned, 8 min actual each
- 1 focus task: 10 min planned, 12 min actual

**Calculation:**
```
Total regular planned: 3 × 10 = 30 minutes
Total regular actual: 3 × 8 = 24 minutes
Ratio: 24/30 = 0.8
Since ratio < 1: efficiency = 0.8 (or 80%)
Focus task ignored in calculation
```

#### Scenario 2: Slow Regular Tasks
- 2 regular tasks: 10 min planned, 12 min actual each
- 1 focus task: 15 min planned, 10 min actual

**Calculation:**
```
Total regular planned: 2 × 10 = 20 minutes
Total regular actual: 2 × 12 = 24 minutes
Ratio: 24/20 = 1.2
Since ratio >= 1: efficiency = 1 - 1.2 = -0.2 (or -20%)
Focus task ignored in calculation
```

#### Scenario 3: Grace System Example
- Last 30 days: 5 routines with negative efficiency (-10%, -5%, -15%, -8%, -12%)
- Average before Grace System: (-10 + -5 + -15 + -8 + -12) / 5 = -10%
- Grace System penalty: 2 × (-50%) = -100%
- Final efficiency: -10% + (-100%) = -110%

#### Scenario 4: Grace System Forgiveness
- Last 30 days: 3 routines with negative efficiency (-5%, -10%, -8%)
- Average: (-5 + -10 + -8) / 3 = -7.67%
- Grace System: No penalty (≤ 3 negative routines)
- Final efficiency: -7.67%

## Implementation Plan

### Phase 1: Core Formula Implementation
1. Implement new `calculateRoutineEfficiency()` with ratio-based formula
2. Create `calculateOverallEfficiency()` with Grace System logic
3. Update efficiency calculation tests and validation

### Phase 2: Grace System Implementation
1. Implement Grace System penalty calculation
2. Update `fetchUserEfficiencyStats()` to apply Grace System
3. Add Grace System breakdown for user transparency

### Phase 3: Integration Updates
1. Update routine completion flow in `Index.tsx`
2. Modify efficiency display components
3. Update belt ranking system if needed

### Phase 4: Data Migration & Testing
1. Recalculate existing routine efficiency scores
2. Validate Grace System with historical data
3. Test UI updates with new scoring system

### Phase 5: Deployment
1. Deploy with comprehensive testing
2. Monitor efficiency score distributions
3. Validate Grace System behavior in production