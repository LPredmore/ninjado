import React from 'react';
import { Clock } from 'lucide-react';

interface TimeTrackerProps {
  totalTimeSaved: number;
}

const TimeTracker = ({ totalTimeSaved }: TimeTrackerProps) => {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(Math.abs(minutes) / 60);
    const remainingMinutes = Math.abs(minutes) % 60;
    const sign = minutes < 0 ? '-' : '+';
    
    if (hours > 0) {
      return `${sign}${hours}h ${remainingMinutes}m`;
    }
    return `${sign}${remainingMinutes}m`;
  };

  return (
    <div className="md:fixed md:top-4 md:left-4 bg-white rounded-lg shadow-lg p-4 flex items-center space-x-2 mb-4 md:mb-0">
      <Clock className="w-5 h-5 text-ninja-primary" />
      <div>
        <p className="text-sm text-gray-500">Time Saved</p>
        <p className={`text-lg font-semibold ${totalTimeSaved >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatTime(totalTimeSaved)}
        </p>
      </div>
    </div>
  );
};

export default TimeTracker;