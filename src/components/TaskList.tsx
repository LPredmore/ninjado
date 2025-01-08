import React, { useState } from 'react';
import TaskCard from './TaskCard';
import TaskDialog from './TaskDialog';
import { Task } from '@/types';
import { Button } from './ui/button';
import { ArrowUp, ArrowDown, SkipForward } from 'lucide-react';
import { toast } from 'sonner';

interface TaskListProps {
  tasks: Task[];
  onTaskComplete: (taskId: string, timeSaved: number) => void;
  isRoutineStarted: boolean;
}

const TaskList = ({ 
  tasks: initialTasks,
  onTaskComplete,
  isRoutineStarted
}: TaskListProps) => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDuration, setNewTaskDuration] = useState('');

  const handleMoveTask = (index: number, direction: 'up' | 'down') => {
    const newTasks = [...tasks];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex >= 0 && newIndex < tasks.length) {
      [newTasks[index], newTasks[newIndex]] = [newTasks[newIndex], newTasks[index]];
      setTasks(newTasks);
      toast.success('Task reordered successfully');
    }
  };

  const handleSkipTask = (taskId: string) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, isSkipped: true, isCompleted: true } 
          : task
      )
    );
    toast.success('Task skipped');
  };

  const handleAddTask = () => {
    if (!newTaskTitle || !newTaskDuration) {
      toast.error('Please fill in all task details');
      return;
    }

    const newTask: Task = {
      id: `temp-${Date.now()}`,
      title: newTaskTitle,
      duration: parseInt(newTaskDuration),
      isActive: false,
      isCompleted: false,
    };

    setTasks(prevTasks => [...prevTasks, newTask]);
    setNewTaskTitle('');
    setNewTaskDuration('');
    toast.success('Temporary task added');
  };

  return (
    <div className="space-y-4 animate-slide-up">
      {tasks.map((task, index) => (
        <div key={task.id} className="relative group">
          <TaskCard
            task={task}
            onComplete={(timeSaved) => onTaskComplete(task.id, timeSaved)}
            onEdit={() => {}}
            onDelete={() => {}}
            isRoutineStarted={isRoutineStarted}
          />
          
          {!task.isCompleted && (
            <div className="absolute right-2 top-2 flex space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleMoveTask(index, 'up')}
                disabled={index === 0}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleMoveTask(index, 'down')}
                disabled={index === tasks.length - 1}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleSkipTask(task.id)}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      ))}

      <TaskDialog
        editingTask={null}
        newTaskTitle={newTaskTitle}
        newTaskDuration={newTaskDuration}
        onTitleChange={setNewTaskTitle}
        onDurationChange={setNewTaskDuration}
        onSubmit={handleAddTask}
        isRoutineStarted={isRoutineStarted}
      />
    </div>
  );
};

export default TaskList;