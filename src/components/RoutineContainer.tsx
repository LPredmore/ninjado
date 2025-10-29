
import React from 'react';
import RoutineProgress from './RoutineProgress';
import TaskList from './TaskList';
import { Task } from '@/types';
import { NinjaScrollCard } from '@/components/ninja/NinjaScrollCard';

interface RoutineContainerProps {
  routineTitle: string;
  tasks: Task[];
  completedTasks: number;
  isRoutineStarted: boolean;
  isPaused: boolean;
  onStartRoutine: () => void;
  onPauseRoutine: () => void;
  onTaskComplete: (taskId: string, timeSaved: number) => Promise<void>;
  onTaskReorder: (tasks: Task[]) => void;
  userId: string;
  routineStartTime: number | null;
}

const RoutineContainer = ({
  routineTitle,
  tasks,
  completedTasks,
  isRoutineStarted,
  isPaused,
  onStartRoutine,
  onPauseRoutine,
  onTaskComplete,
  onTaskReorder,
  userId,
  routineStartTime,
}: RoutineContainerProps) => {
  return (
    <NinjaScrollCard 
      title={`🥷 ${routineTitle} - Training Session`}
      variant="mission"
      className="p-3 md:p-6 max-w-full overflow-hidden"
    >
      <div className="space-y-8">
        <RoutineProgress
          routineTitle={routineTitle}
          completedTasks={completedTasks}
          totalTasks={tasks.length}
          isRoutineStarted={isRoutineStarted}
          isPaused={isPaused}
          onStartRoutine={onStartRoutine}
          onPauseRoutine={onPauseRoutine}
          userId={userId}
          tasks={tasks}
          routineStartTime={routineStartTime}
        />
        
        <div className="clay-element p-6">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <span className="clay-element w-6 h-6 gradient-clay-accent rounded-lg flex items-center justify-center text-xs">
              📋
            </span>
            Mission Tasks
          </h3>
          <TaskList
            tasks={tasks}
            onTaskComplete={onTaskComplete}
            isRoutineStarted={isRoutineStarted}
            isPaused={isPaused}
            onTaskReorder={onTaskReorder}
            userId={userId}
          />
        </div>
      </div>
    </NinjaScrollCard>
  );
};

export default RoutineContainer;
