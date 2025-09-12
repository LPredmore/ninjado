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
    <div className="flex items-center space-x-2 bg-card rounded-lg px-3 py-2 shadow-sm border">
      <Trophy className="w-4 h-4 text-primary" />
      <div>
        <p className="text-xs text-muted-foreground">Time Saved</p>
        <p className="text-sm font-semibold text-primary">
          {formatTimeDisplay(totalTimeSaved)}
        </p>
      </div>
    </div>
  );
};

export default TimeTracker;