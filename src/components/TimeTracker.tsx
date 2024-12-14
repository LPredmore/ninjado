import React from 'react';
import { Trophy } from 'lucide-react';

interface TimeTrackerProps {
  totalTimeSaved: number;
}

const TimeTracker = ({ totalTimeSaved }: TimeTrackerProps) => {
  return (
    <div className="md:fixed md:top-4 md:left-4 bg-white rounded-lg shadow-lg p-4 flex items-center space-x-2 mb-4 md:mb-0">
      <Trophy className="w-5 h-5 text-ninja-primary" />
      <div>
        <p className="text-sm text-gray-500">Points Earned</p>
        <p className="text-lg font-semibold text-ninja-primary">
          {totalTimeSaved} points
        </p>
      </div>
    </div>
  );
};

export default TimeTracker;