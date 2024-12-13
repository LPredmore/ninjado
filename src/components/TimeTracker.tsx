import React from 'react';
import { Clock } from 'lucide-react';

interface TimeTrackerProps {
  totalTimeSaved: number;
}

const TimeTracker = ({ totalTimeSaved }: TimeTrackerProps) => {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(Math.abs(seconds) / 60);
    const remainingSeconds = Math.abs(seconds) % 60;
    const sign = seconds < 0 ? '-' : '+';
    return `${sign}${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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