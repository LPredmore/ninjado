import React from 'react';
import { Card } from '@/components/ui/card';
import TaskTimer from './task/TaskTimer';
import TaskCompleteButton from './task/TaskCompleteButton';
import TaskProgress from './task/TaskProgress';
import { Task } from '@/types';
import { SkipForward } from 'lucide-react';

interface TaskCardProps {
  task: Task & { timeLeft?: number };
  onComplete: (timeSaved: number) => void;
  onEdit: () => void;
  onDelete: () => void;
  isRoutineStarted: boolean;
}

const TaskCard = ({
  task,
  onComplete,
  onEdit,
  onDelete,
  isRoutineStarted,
}: TaskCardProps) => {
  const handleComplete = () => {
    if (task.timeLeft !== undefined) {
      onComplete(task.timeLeft);
    }
  };

  return (
    <Card className={task.isCompleted ? "opacity-50" : ""}>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-semibold text-ninja-text">{task.title}</h2>
            {task.isSkipped && (
              <span className="flex items-center text-gray-500 text-sm">
                <SkipForward className="w-4 h-4 mr-1" />
                Skipped
              </span>
            )}
          </div>
          {task.isActive && !task.isCompleted && isRoutineStarted && (
            <TaskCompleteButton onClick={handleComplete} />
          )}
        </div>

        <TaskTimer
          timeLeft={task.timeLeft}
          duration={task.duration}
          isActive={task.isActive}
          isRoutineStarted={isRoutineStarted}
        />

        {task.isActive && isRoutineStarted && task.timeLeft !== undefined && (
          <TaskProgress timeLeft={task.timeLeft} duration={task.duration} />
        )}
      </div>
    </Card>
  );
};

export default TaskCard;