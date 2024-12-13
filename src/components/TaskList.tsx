import React from 'react';
import TaskCard from './TaskCard';
import { Task } from '@/types';

interface TaskListProps {
  tasks: Task[];
  onTaskComplete: (taskId: string) => void;
  isRoutineStarted: boolean;
}

const TaskList = ({ 
  tasks,
  onTaskComplete,
  isRoutineStarted
}: TaskListProps) => {
  return (
    <div className="space-y-4 animate-slide-up">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onComplete={() => onTaskComplete(task.id)}
          onEdit={() => {}}
          onDelete={() => {}}
          isRoutineStarted={isRoutineStarted}
        />
      ))}
    </div>
  );
};

export default TaskList;