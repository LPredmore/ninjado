import React from 'react';
import TaskCard from './TaskCard';
import { Task } from '@/types';

interface TaskListProps {
  tasks: Task[];
  onTaskComplete: (taskId: string, timeSaved: number) => void;
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
          onComplete={(timeSaved) => onTaskComplete(task.id, timeSaved)}
          onEdit={() => {}}
          onDelete={() => {}}
          isRoutineStarted={isRoutineStarted}
        />
      ))}
    </div>
  );
};

export default TaskList;