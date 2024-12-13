import React from 'react';
import { Clock, Trash2, ArrowUp, ArrowDown, Edit } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { SupabaseClient } from '@supabase/supabase-js';

interface TaskItemProps {
  task: {
    id: string;
    title: string;
    duration: number;
    position: number;
  };
  isFirst: boolean;
  isLast: boolean;
  onTaskUpdate: () => void;
  supabase: SupabaseClient;
}

const TaskItem = ({ 
  task, 
  isFirst, 
  isLast, 
  onTaskUpdate,
  supabase 
}: TaskItemProps) => {
  const [editingTask, setEditingTask] = React.useState<{
    id: string;
    title: string;
    duration: number;
  } | null>(null);

  const handleEditTask = async () => {
    if (!editingTask || !editingTask.title.trim()) {
      toast.error('Please fill in all task details');
      return;
    }

    const { error } = await supabase
      .from('routine_tasks')
      .update({
        title: editingTask.title,
        duration: editingTask.duration
      })
      .eq('id', editingTask.id);

    if (error) {
      toast.error('Failed to update task');
      return;
    }

    setEditingTask(null);
    onTaskUpdate();
    toast.success('Task updated successfully');
  };

  const handleDeleteTask = async () => {
    const { error } = await supabase
      .from('routine_tasks')
      .delete()
      .eq('id', task.id);

    if (error) {
      toast.error('Failed to delete task');
      return;
    }

    onTaskUpdate();
    toast.success('Task deleted successfully');
  };

  const handleMoveTask = async (direction: 'up' | 'down') => {
    const newPosition = direction === 'up' 
      ? task.position - 1
      : task.position + 1;

    const { error } = await supabase
      .from('routine_tasks')
      .update({ position: newPosition })
      .eq('id', task.id);

    if (error) {
      toast.error('Failed to reorder task');
      return;
    }

    onTaskUpdate();
  };

  return (
    <div className="p-3 rounded-lg border border-gray-200 flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <Clock className="w-4 h-4 text-ninja-primary" />
        <span>{task.title}</span>
        <span className="text-sm text-gray-500">{task.duration} min</span>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleMoveTask('up')}
          disabled={isFirst}
        >
          <ArrowUp className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleMoveTask('down')}
          disabled={isLast}
        >
          <ArrowDown className="w-4 h-4" />
        </Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditingTask({
                id: task.id,
                title: task.title,
                duration: task.duration
              })}
            >
              <Edit className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
              <DialogDescription>Make changes to your task here.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Task Name</label>
                <Input
                  value={editingTask?.title ?? ''}
                  onChange={(e) => setEditingTask(prev => prev ? {...prev, title: e.target.value} : null)}
                  placeholder="Enter task name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Duration (minutes)</label>
                <Input
                  type="number"
                  value={editingTask?.duration ?? ''}
                  onChange={(e) => setEditingTask(prev => prev ? {...prev, duration: parseInt(e.target.value)} : null)}
                  placeholder="Enter duration in minutes"
                  min="1"
                />
              </div>
              <Button
                className="w-full bg-ninja-primary text-white hover:bg-ninja-primary/90"
                onClick={handleEditTask}
              >
                Update Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDeleteTask}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default TaskItem;