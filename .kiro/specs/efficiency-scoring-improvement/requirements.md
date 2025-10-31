# Requirements Document

## Introduction

This feature improves the efficiency scoring system to provide more meaningful and motivating feedback to users. The current system uses planned task durations as the denominator, which can result in low efficiency scores even when users perform well. The new system will use actual time spent as the baseline, making efficiency scores more intuitive and rewarding.

## Glossary

- **Efficiency_System**: The component responsible for calculating user performance metrics
- **Regular_Task**: A speed-focused task where faster completion is rewarded
- **Focus_Task**: A concentration-focused task where staying within time limits is the goal
- **Actual_Time**: The real time spent completing a task
- **Planned_Time**: The originally allocated duration for a task
- **Time_Saved**: The difference between planned and actual time (positive when faster)
- **Efficiency_Score**: A percentage representing user performance relative to actual time spent

## Requirements

### Requirement 1

**User Story:** As a productivity ninja, I want my efficiency score to reflect meaningful performance gains, so that I feel motivated when I complete tasks faster than planned.

#### Acceptance Criteria

1. WHEN a user completes regular tasks faster than planned, THE Efficiency_System SHALL calculate efficiency using actual time spent as the denominator
2. WHEN a user completes regular tasks slower than planned, THE Efficiency_System SHALL calculate efficiency using actual time spent as the denominator
3. THE Efficiency_System SHALL exclude Focus_Task planned durations from efficiency calculations
4. THE Efficiency_System SHALL include Focus_Task overruns as penalties in efficiency calculations
5. THE Efficiency_System SHALL ensure efficiency scores are intuitive and motivating for users

### Requirement 2

**User Story:** As a productivity ninja, I want focus task overruns to impact my efficiency score appropriately, so that I'm encouraged to stay within focus time limits while not being penalized for completing focus tasks quickly.

#### Acceptance Criteria

1. WHEN a user completes a Focus_Task within the planned time, THE Efficiency_System SHALL not include any time penalty in efficiency calculations
2. WHEN a user exceeds the planned time on a Focus_Task, THE Efficiency_System SHALL include the overrun time as a penalty in efficiency calculations
3. THE Efficiency_System SHALL not include Focus_Task planned durations in the total routine duration calculation
4. THE Efficiency_System SHALL ensure Focus_Task penalties are proportional to the overrun amount

### Requirement 3

**User Story:** As a productivity ninja, I want consistent efficiency scoring across different routine compositions, so that my performance metrics are comparable regardless of the mix of regular and focus tasks.

#### Acceptance Criteria

1. THE Efficiency_System SHALL calculate efficiency using the formula: (time_saved / actual_time_spent) * 100
2. THE Efficiency_System SHALL define actual_time_spent as the sum of actual completion times for regular tasks plus any focus task overruns
3. THE Efficiency_System SHALL define time_saved as the sum of (planned_time - actual_time) for regular tasks minus any focus task overruns
4. THE Efficiency_System SHALL ensure the calculation produces the target efficiency scores for the specified test scenarios
5. THE Efficiency_System SHALL maintain backward compatibility with existing routine completion data