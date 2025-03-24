
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import TaskTimer from './task/TaskTimer';
import TaskCompleteButton from './task/TaskCompleteButton';
import TaskProgress from './task/TaskProgress';
import { Task } from '@/types';

interface TaskCardProps {
  task: Task & { timeLeft?: number };
  onComplete: (timeSaved: number) => void;
  onEdit: () => void;
  onDelete: () => void;
  isRoutineStarted: boolean;
  isPaused?: boolean;
}

const TaskCard = ({
  task,
  onComplete,
  onEdit,
  onDelete,
  isRoutineStarted,
  isPaused,
}: TaskCardProps) => {
  const handleComplete = () => {
    if (task.timeLeft !== undefined) {
      if (task.type === 'focus') {
        // For focus tasks, only record negative time when over the limit
        const timeSaved = task.timeLeft < 0 ? task.timeLeft : 0;
        onComplete(timeSaved);
      } else {
        // For regular tasks, record any remaining time as saved
        onComplete(task.timeLeft);
      }
    }
  };

  return (
    <Card className={task.isCompleted ? "opacity-50" : ""}>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-ninja-text">{task.title}</h2>
            {task.type === 'focus' && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                Focus
              </Badge>
            )}
          </div>
          {task.isActive && !task.isCompleted && isRoutineStarted && !isPaused && (
            <TaskCompleteButton onClick={handleComplete} />
          )}
        </div>

        <TaskTimer
          timeLeft={task.timeLeft}
          duration={task.duration}
          isActive={task.isActive && isRoutineStarted}
          isRoutineStarted={isRoutineStarted}
          isPaused={isPaused}
          isFocusTask={task.type === 'focus'}
        />

        {task.isActive && isRoutineStarted && task.timeLeft !== undefined && (
          <TaskProgress 
            timeLeft={task.timeLeft} 
            duration={task.duration}
            isFocusTask={task.type === 'focus'}
          />
        )}
      </div>
    </Card>
  );
};

export default TaskCard;
