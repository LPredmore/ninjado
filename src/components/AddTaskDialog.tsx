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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";

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
  const [taskType, setTaskType] = useState<'regular' | 'focus'>('regular');
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const handleCreateTask = async () => {
    const durationMinutes = parseInt(newTaskDuration, 10);

    if (!newTaskTitle.trim() || isNaN(durationMinutes) || durationMinutes <= 0) {
      toast.error('Please fill in all task details');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('routine_tasks')
        .insert([
          {
            routine_id: routineId,
            title: newTaskTitle,
            duration: durationMinutes,
            position: tasksCount,
            type: taskType,
          },
        ]);

      if (error) throw error;

      setNewTaskTitle('');
      setNewTaskDuration('');
      setTaskType('regular');
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["routines"] });
      toast.success('Task added successfully');
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
          <div className="space-y-2">
            <label className="text-sm font-medium">Task Type</label>
            <Select
              value={taskType}
              onValueChange={(value: 'regular' | 'focus') => setTaskType(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select task type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Speed Task</SelectItem>
                <SelectItem value="focus">Focus Task</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            className="w-full bg-ninja-primary text-white hover:bg-ninja-primary/90"
            onClick={handleCreateTask}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Adding..." : "Add Task"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddTaskDialog;
