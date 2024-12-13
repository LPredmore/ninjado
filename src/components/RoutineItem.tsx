import React, { useState } from 'react';
import { List, Clock, Trash2, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
          >
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-ninja-primary" />
              <span>{task.title}</span>
            </div>
            <span className="text-sm text-gray-500">{task.duration} min</span>
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