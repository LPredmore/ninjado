import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
}

const ProgressBar = ({ current, total }: ProgressBarProps) => {
  const percentage = (current / total) * 100;

  return (
    <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
      <div
        className="h-full bg-ninja-primary transition-all duration-300 rounded-full"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

export default ProgressBar;