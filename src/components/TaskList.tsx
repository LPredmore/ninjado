import React from 'react';
import TaskCard from './TaskCard';

interface Task {
  id: string;
  title: string;
  duration: number;
  isActive: boolean;
  isCompleted: boolean;
}

interface TaskListProps {
  tasks: Task[];
  activeTaskIndex: number;
  timeLeft: number;
  onTaskComplete: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  isRoutineStarted: boolean;
}

const TaskList = ({ 
  tasks, 
  activeTaskIndex, 
  timeLeft, 
  onTaskComplete,
  onEditTask,
  onDeleteTask,
  isRoutineStarted
}: TaskListProps) => {
  return (
    <div className="space-y-4 animate-slide-up">
      {tasks.map((task, index) => (
        <TaskCard
          key={task.id}
          task={task}
          timeLeft={index === activeTaskIndex ? timeLeft : undefined}
          onComplete={() => onTaskComplete(task.id)}
          onEdit={() => onEditTask(task)}
          onDelete={() => onDeleteTask(task.id)}
          isRoutineStarted={isRoutineStarted}
        />
      ))}
    </div>
  );
};

export default TaskList;