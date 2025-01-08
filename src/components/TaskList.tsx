import React from 'react';
import TaskCard from './TaskCard';
import { Task } from '@/types';
import { Button } from './ui/button';
import { ArrowUpIcon, ArrowDownIcon, SkipForwardIcon, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { toast } from 'sonner';

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
  const [localTasks, setLocalTasks] = React.useState<Task[]>(tasks);
  const [newTaskTitle, setNewTaskTitle] = React.useState('');
  const [newTaskDuration, setNewTaskDuration] = React.useState('');

  // Update local tasks when parent tasks change
  React.useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const handleMoveTask = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === localTasks.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newTasks = [...localTasks];
    [newTasks[index], newTasks[newIndex]] = [newTasks[newIndex], newTasks[index]];
    setLocalTasks(newTasks);
  };

  const handleSkipTask = (taskId: string) => {
    setLocalTasks(prev => 
      prev.filter(task => task.id !== taskId)
    );
    toast.success('Task skipped');
  };

  const handleAddTemporaryTask = () => {
    if (!newTaskTitle.trim() || !newTaskDuration.trim()) {
      toast.error('Please fill in all task details');
      return;
    }

    const newTask: Task = {
      id: `temp-${Date.now()}`,
      title: newTaskTitle,
      duration: parseInt(newTaskDuration),
      isActive: false,
      isCompleted: false
    };

    setLocalTasks(prev => [...prev, newTask]);
    setNewTaskTitle('');
    setNewTaskDuration('');
    toast.success('Temporary task added');
  };

  return (
    <div className="space-y-4">
      {localTasks.map((task, index) => (
        <div key={task.id} className="relative group">
          <TaskCard
            task={task}
            onComplete={(timeSaved) => onTaskComplete(task.id, timeSaved)}
            onEdit={() => {}}
            onDelete={() => {}}
            isRoutineStarted={isRoutineStarted}
          />
          {!isRoutineStarted && (
            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleMoveTask(index, 'up')}
                disabled={index === 0}
                className="bg-white/90 hover:bg-white"
              >
                <ArrowUpIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleMoveTask(index, 'down')}
                disabled={index === localTasks.length - 1}
                className="bg-white/90 hover:bg-white"
              >
                <ArrowDownIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleSkipTask(task.id)}
                className="bg-white/90 hover:bg-white"
              >
                <SkipForwardIcon className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      ))}

      {!isRoutineStarted && (
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full mt-4" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Temporary Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Temporary Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">Task Name</label>
                <Input
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Enter task name"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Duration (minutes)</label>
                <Input
                  type="number"
                  value={newTaskDuration}
                  onChange={(e) => setNewTaskDuration(e.target.value)}
                  placeholder="Enter duration"
                  min="1"
                  className="mt-1"
                />
              </div>
              <Button onClick={handleAddTemporaryTask} className="w-full">
                Add Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default TaskList;