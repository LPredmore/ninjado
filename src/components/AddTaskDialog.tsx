import React, { useState } from 'react';
import { Plus } from 'lucide-react';
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

interface AddTaskDialogProps {
  routineId: string;
  routineTitle: string;
  tasksCount: number;
  onTasksUpdate: () => void;
  supabase: SupabaseClient;
}

const AddTaskDialog = ({ 
  routineId, 
  routineTitle, 
  tasksCount,
  onTasksUpdate,
  supabase 
}: AddTaskDialogProps) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDuration, setNewTaskDuration] = useState('');

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || !newTaskDuration) {
      toast.error('Please fill in all task details');
      return;
    }

    const { error } = await supabase
      .from('routine_tasks')
      .insert([
        {
          routine_id: routineId,
          title: newTaskTitle,
          duration: parseInt(newTaskDuration),
          position: tasksCount
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

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          className="w-full mt-2 bg-ninja-accent text-white hover:bg-ninja-accent/90"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Task to {routineTitle}</DialogTitle>
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
  );
};

export default AddTaskDialog;