import React, { useState } from 'react';
import { List, Clock, Trash2, Plus, ArrowUp, ArrowDown, Edit } from 'lucide-react';
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

interface RoutineItemProps {
  routine: {
    id: string;
    title: string;
  };
  tasks: {
    id: string;
    title: string;
    duration: number;
    position: number;
  }[];
  onDelete: (routineId: string) => void;
  supabase: SupabaseClient;
  onTasksUpdate: () => void;
  isSelected: boolean;
  onSelect: () => void;
}

const RoutineItem = ({ 
  routine, 
  tasks, 
  onDelete, 
  supabase, 
  onTasksUpdate,
  isSelected,
  onSelect
}: RoutineItemProps) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDuration, setNewTaskDuration] = useState('');
  const [editingTask, setEditingTask] = useState<{id: string, title: string, duration: number} | null>(null);

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || !newTaskDuration) {
      toast.error('Please fill in all task details');
      return;
    }

    const position = tasks.length;
    const { error } = await supabase
      .from('routine_tasks')
      .insert([
        {
          routine_id: routine.id,
          title: newTaskTitle,
          duration: parseInt(newTaskDuration),
          position
        }
      ]);

    if (error) {
      toast.error('Failed to create task');
      return;
    }

    setNewTaskTitle('');
    setNewTaskDuration('');
    onTasksUpdate();
    toast.success('Task added successfully');
  };

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
    onTasksUpdate();
    toast.success('Task updated successfully');
  };

  const handleDeleteTask = async (taskId: string) => {
    const { error } = await supabase
      .from('routine_tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      toast.error('Failed to delete task');
      return;
    }

    onTasksUpdate();
    toast.success('Task deleted successfully');
  };

  const handleMoveTask = async (taskId: string, direction: 'up' | 'down') => {
    const currentTask = tasks.find(t => t.id === taskId);
    if (!currentTask) return;

    const newPosition = direction === 'up' 
      ? Math.max(0, currentTask.position - 1)
      : Math.min(tasks.length - 1, currentTask.position + 1);

    if (newPosition === currentTask.position) return;

    const swapTask = tasks.find(t => t.position === newPosition);
    if (!swapTask) return;

    const { error: error1 } = await supabase
      .from('routine_tasks')
      .update({ position: newPosition })
      .eq('id', taskId);

    const { error: error2 } = await supabase
      .from('routine_tasks')
      .update({ position: currentTask.position })
      .eq('id', swapTask.id);

    if (error1 || error2) {
      toast.error('Failed to reorder tasks');
      return;
    }

    onTasksUpdate();
  };

  return (
    <div
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
        isSelected
          ? 'border-ninja-primary bg-ninja-primary/10'
          : 'border-gray-200 hover:border-ninja-primary/50'
      }`}
      onClick={onSelect}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <List className="w-5 h-5 text-ninja-primary" />
          <span className="font-medium">{routine.title}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(routine.id);
          }}
        >
          <Trash2 className="w-4 h-4 text-gray-500" />
        </Button>
      </div>

      {/* Tasks List */}
      <div className="mt-4 space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="p-3 rounded-lg border border-gray-200 flex justify-between items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-ninja-primary" />
              <span>{task.title}</span>
              <span className="text-sm text-gray-500">{task.duration} min</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleMoveTask(task.id, 'up')}
                disabled={task.position === 0}
              >
                <ArrowUp className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleMoveTask(task.id, 'down')}
                disabled={task.position === tasks.length - 1}
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
                <DialogContent onClick={(e) => e.stopPropagation()}>
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
                onClick={() => handleDeleteTask(task.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}

        {/* Add Task Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Button 
              className="w-full mt-2 bg-ninja-accent text-white hover:bg-ninja-accent/90"
              onClick={(e) => e.stopPropagation()}
            >
              <Plus className="w-4 h-4 mr-2" /> Add Task
            </Button>
          </DialogTrigger>
          <DialogContent onClick={(e) => e.stopPropagation()}>
            <DialogHeader>
              <DialogTitle>Add New Task to {routine.title}</DialogTitle>
              <DialogDescription>Create a new task for your routine.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Task Name</label>
                <Input
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Enter task name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Duration (minutes)</label>
                <Input
                  type="number"
                  value={newTaskDuration}
                  onChange={(e) => setNewTaskDuration(e.target.value)}
                  placeholder="Enter duration in minutes"
                  min="1"
                />
              </div>
              <Button
                className="w-full bg-ninja-primary text-white hover:bg-ninja-primary/90"
                onClick={handleCreateTask}
              >
                Add Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default RoutineItem;