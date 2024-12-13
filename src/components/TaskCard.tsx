import React from 'react';
import { Clock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    duration: number;
    isActive: boolean;
    isCompleted: boolean;
  };
  onComplete: () => void;
  timeLeft?: number;
}

const TaskCard = ({ task, onComplete, timeLeft }: TaskCardProps) => {
  return (
    <div
      className={cn(
        "p-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-[1.02]",
        "bg-white border-2",
        task.isActive ? "border-ninja-primary" : "border-gray-100",
        task.isCompleted && "opacity-50"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div
            className={cn(
              "p-3 rounded-full",
              task.isActive ? "bg-ninja-primary/10" : "bg-gray-100"
            )}
          >
            <Clock
              className={cn(
                "w-6 h-6",
                task.isActive ? "text-ninja-primary" : "text-gray-400"
              )}
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-ninja-text">{task.title}</h3>
            <p className="text-sm text-gray-500">
              {timeLeft !== undefined
                ? `${Math.floor(timeLeft / 60)}:${(timeLeft % 60)
                    .toString()
                    .padStart(2, "0")} left`
                : `${task.duration} minutes`}
            </p>
          </div>
        </div>
        {task.isActive && !task.isCompleted && (
          <button
            onClick={onComplete}
            className="flex items-center space-x-2 px-4 py-2 rounded-full bg-ninja-primary text-white font-medium hover:bg-ninja-primary/90 transition-colors"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Complete</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskCard;