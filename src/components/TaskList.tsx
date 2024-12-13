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
}

const TaskList = ({ tasks, activeTaskIndex, timeLeft, onTaskComplete }: TaskListProps) => {
  return (
    <div className="space-y-4 animate-slide-up">
      {tasks.map((task, index) => (
        <TaskCard
          key={task.id}
          task={task}
          timeLeft={index === activeTaskIndex ? timeLeft : undefined}
          onComplete={() => onTaskComplete(task.id)}
        />
      ))}
    </div>
  );
};

export default TaskList;