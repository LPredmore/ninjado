import React from 'react';
import RoutineProgress from './RoutineProgress';
import TaskList from './TaskList';
import { Task } from '@/types';

interface RoutineContainerProps {
  tasks: Task[];
  completedTasks: number;
  isRoutineStarted: boolean;
  onStartRoutine: () => void;
  onTaskComplete: (taskId: string, timeTaken: number) => Promise<void>;
}

const RoutineContainer = ({
  tasks,
  completedTasks,
  isRoutineStarted,
  onStartRoutine,
  onTaskComplete,
}: RoutineContainerProps) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg space-y-6">
      <RoutineProgress
        completedTasks={completedTasks}
        totalTasks={tasks.length}
        isRoutineStarted={isRoutineStarted}
        onStartRoutine={onStartRoutine}
      />
      <TaskList
        tasks={tasks}
        onTaskComplete={onTaskComplete}
        isRoutineStarted={isRoutineStarted}
      />
    </div>
  );
};

export default RoutineContainer;