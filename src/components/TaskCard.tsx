import React from 'react';
import { Clock, CheckCircle, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    duration: number;
    isActive: boolean;
    isCompleted: boolean;
  };
  onComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
  timeLeft?: number;
  isRoutineStarted: boolean;
}

const TaskCard = ({ task, onComplete, onEdit, onDelete, timeLeft, isRoutineStarted }: TaskCardProps) => {
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
        <div className="flex items-center space-x-2">
          {!isRoutineStarted && !task.isCompleted && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={onEdit}
                className="hover:bg-gray-100"
              >
                <Pencil className="w-4 h-4 text-gray-500" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                className="hover:bg-gray-100"
              >
                <Trash2 className="w-4 h-4 text-gray-500" />
              </Button>
            </>
          )}
          {task.isActive && !task.isCompleted && (
            <Button
              onClick={onComplete}
              className="flex items-center space-x-2 bg-ninja-primary text-white hover:bg-ninja-primary/90"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Complete</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;