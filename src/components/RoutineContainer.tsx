
import React from 'react';
import RoutineProgress from './RoutineProgress';
import TaskList from './TaskList';
import { Task } from '@/types';

interface RoutineContainerProps {
  tasks: Task[];
  completedTasks: number;
  isRoutineStarted: boolean;
  isPaused: boolean;
  onStartRoutine: () => void;
  onPauseRoutine: () => void;
  onTaskComplete: (taskId: string, timeSaved: number) => Promise<void>;
  onTaskReorder: (tasks: Task[]) => void;
}

const RoutineContainer = ({
  tasks,
  completedTasks,
  isRoutineStarted,
  isPaused,
  onStartRoutine,
  onPauseRoutine,
  onTaskComplete,
  onTaskReorder,
}: RoutineContainerProps) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg space-y-6">
      <RoutineProgress
        completedTasks={completedTasks}
        totalTasks={tasks.length}
        isRoutineStarted={isRoutineStarted}
        isPaused={isPaused}
        onStartRoutine={onStartRoutine}
        onPauseRoutine={onPauseRoutine}
      />
      <TaskList
        tasks={tasks}
        onTaskComplete={onTaskComplete}
        isRoutineStarted={isRoutineStarted}
        isPaused={isPaused}
        onTaskReorder={onTaskReorder}
      />
    </div>
  );
};

export default RoutineContainer;
