import React from 'react';
import { Trophy } from 'lucide-react';

interface TimeTrackerProps {
  totalTimeSaved: number;
}

const TimeTracker = ({ totalTimeSaved }: TimeTrackerProps) => {
  const formatTimeDisplay = (seconds: number) => {
    const minutes = Math.floor(Math.abs(seconds) / 60);
    const remainingSeconds = Math.abs(seconds) % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="flex items-center space-x-1.5 md:space-x-2 bg-card rounded-lg px-2 md:px-3 py-1.5 md:py-2 shadow-sm border max-w-full">
      <Trophy className="w-3 h-3 md:w-4 md:h-4 text-primary shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] md:text-xs text-muted-foreground truncate">Time Saved</p>
        <p className="text-xs md:text-sm font-semibold text-primary truncate">
          {formatTimeDisplay(totalTimeSaved)}
        </p>
      </div>
    </div>
  );
};

export default TimeTracker;