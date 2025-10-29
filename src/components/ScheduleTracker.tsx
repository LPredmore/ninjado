import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ScheduleTrackerProps {
  tasks: any[];
  completedTasks: number;
  totalTasks: number;
  routineStartTime: number;
  isPaused: boolean;
}

const ScheduleTracker = ({ 
  tasks, 
  completedTasks, 
  totalTasks, 
  routineStartTime,
  isPaused 
}: ScheduleTrackerProps) => {
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  // Update every second when not paused
  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isPaused]);
  
  // Calculate total duration
  const totalMinutes = tasks.reduce((sum, task) => sum + (task.duration || 0), 0);
  
  // Calculate elapsed time
  const elapsedMinutes = (currentTime - routineStartTime) / 60000;
  
  // Calculate expected progress
  const expectedProgress = Math.min(
    (elapsedMinutes / totalMinutes) * totalTasks,
    totalTasks
  );
  
  // Calculate variance
  const variance = completedTasks - expectedProgress;
  const varianceMinutes = (variance / totalTasks) * totalMinutes;
  
  // Determine status
  const isAhead = variance > 0.5;
  const isBehind = variance < -0.5;
  const isOnTrack = !isAhead && !isBehind;
  
  // Format time
  const formatTime = (minutes: number) => {
    const absMinutes = Math.abs(Math.round(minutes));
    if (absMinutes < 60) return `${absMinutes}m`;
    const hours = Math.floor(absMinutes / 60);
    const mins = absMinutes % 60;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-foreground">
          Training Pace:
        </span>
        <span className={cn(
          "text-sm font-semibold flex items-center gap-2",
          isAhead && "text-green-600 dark:text-green-500",
          isBehind && "text-amber-600 dark:text-amber-500",
          isOnTrack && "text-blue-600 dark:text-blue-500"
        )}>
          {isAhead && (
            <>
              <span>⚡</span>
              <span>{formatTime(varianceMinutes)} ahead</span>
            </>
          )}
          {isBehind && (
            <>
              <span>⏰</span>
              <span>{formatTime(varianceMinutes)} behind</span>
            </>
          )}
          {isOnTrack && (
            <>
              <span>🎯</span>
              <span>On track!</span>
            </>
          )}
        </span>
      </div>
      
      {/* Visual indicator bar */}
      <div className="relative h-8 bg-muted rounded-lg overflow-hidden">
        {/* Expected position marker */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-muted-foreground/40 z-10"
          style={{ left: `${Math.min((expectedProgress / totalTasks) * 100, 100)}%` }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-xs">
            📍
          </div>
        </div>
        
        {/* Actual progress bar */}
        <div 
          className={cn(
            "h-full transition-all duration-300",
            isAhead && "bg-green-500",
            isBehind && "bg-amber-500",
            isOnTrack && "bg-blue-500"
          )}
          style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
        />
      </div>
      
      <div className="text-xs text-muted-foreground text-center">
        {completedTasks} of {totalTasks} tasks • Expected: {expectedProgress.toFixed(1)} tasks
        {isPaused && <span className="ml-2 text-amber-600 dark:text-amber-500 font-medium">(Paused)</span>}
      </div>
    </div>
  );
};

export default ScheduleTracker;
