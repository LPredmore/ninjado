import React from 'react';
import { cn } from '@/lib/utils';
interface ScheduleTrackerProps {
  tasks: any[];
  completedTasks: number;
  totalTasks: number;
  routineStartTime: number;
  isPaused: boolean;
  cumulativeTimeSaved: number;
}
const ScheduleTracker = ({
  tasks,
  completedTasks,
  totalTasks,
  routineStartTime,
  isPaused,
  cumulativeTimeSaved
}: ScheduleTrackerProps) => {
  // Calculate total remaining expected time for incomplete tasks
  const remainingTasks = tasks.slice(completedTasks);
  const remainingExpectedSeconds = remainingTasks.reduce((sum, task) => sum + task.duration * 60, 0);

  // Determine overall status
  const isAhead = cumulativeTimeSaved > 0;
  const isBehind = cumulativeTimeSaved < 0;
  const isOnTrack = cumulativeTimeSaved === 0;

  // Format time helper
  const formatTime = (seconds: number) => {
    const absSeconds = Math.abs(seconds);
    if (absSeconds < 60) return `${absSeconds}s`;
    const minutes = Math.floor(absSeconds / 60);
    const secs = absSeconds % 60;
    if (secs === 0) return `${minutes}m`;
    return `${minutes}m ${secs}s`;
  };

  // Motivational messages
  const getMessage = () => {
    if (completedTasks === 0) {
      return "🥷 Begin your training journey!";
    }
    if (completedTasks === totalTasks) {
      if (isAhead) {
        return `🎉 Mission Complete! You finished ${formatTime(cumulativeTimeSaved)} ahead of schedule! You're a true ninja master!`;
      } else if (isBehind) {
        return `✅ Mission Complete! You finished ${formatTime(cumulativeTimeSaved)} over time, but completion is what matters! Keep training!`;
      } else {
        return "🎯 Mission Complete! Perfect timing - right on schedule!";
      }
    }
    if (isAhead) {
      return `⚡ Amazing pace! You've banked ${formatTime(cumulativeTimeSaved)} of extra time. Keep up the excellent work!`;
    } else if (isBehind) {
      return `💪 You're ${formatTime(cumulativeTimeSaved)} behind, but you can still catch up! Focus and speed through the next tasks!`;
    } else {
      return "🎯 You're exactly on schedule! Maintain this perfect pace!";
    }
  };

  // Calculate progress bar width (based on tasks completed, not time)
  const progressPercentage = completedTasks / totalTasks * 100;
  return <div className="space-y-4">
      {/* Main Status Display */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-foreground">
          Overall Time Status:
        </span>
        <span className={cn("text-lg font-bold flex items-center gap-2", isAhead && "text-green-600 dark:text-green-500", isBehind && "text-red-600 dark:text-red-500", isOnTrack && "text-blue-600 dark:text-blue-500")}>
          {isAhead && <>
              <span>⚡</span>
              <span>{formatTime(cumulativeTimeSaved)} ahead</span>
            </>}
          {isBehind && <>
              <span>⏰</span>
              <span>{formatTime(cumulativeTimeSaved)} behind</span>
            </>}
          {isOnTrack && <>
              <span>🎯</span>
              <span>On schedule</span>
            </>}
        </span>
      </div>
      
      {/* Visual progress bar */}
      
      
      {/* Motivational Message */}
      <div className={cn("p-4 rounded-lg border-2 text-center font-medium", isAhead && "bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700 text-green-800 dark:text-green-200", isBehind && "bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200", isOnTrack && "bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200")}>
        {getMessage()}
      </div>
      
      {/* Additional Stats */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Tasks: {completedTasks} / {totalTasks}</span>
        {remainingExpectedSeconds > 0 && <span>Remaining expected: {formatTime(remainingExpectedSeconds)}</span>}
        {isPaused && <span className="text-amber-600 dark:text-amber-500 font-medium">(⏸️ Paused)</span>}
      </div>
    </div>;
};
export default ScheduleTracker;