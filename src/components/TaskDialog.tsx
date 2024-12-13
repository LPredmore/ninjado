import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';

interface TaskDialogProps {
  editingTask: Task | null;
  newTaskTitle: string;
  newTaskDuration: string;
  onTitleChange: (value: string) => void;
  onDurationChange: (value: string) => void;
  onSubmit: () => void;
  isRoutineStarted: boolean;
}

interface Task {
  id: string;
  title: string;
  duration: number;
  isActive: boolean;
  isCompleted: boolean;
}

const TaskDialog = ({
  editingTask,
  newTaskTitle,
  newTaskDuration,
  onTitleChange,
  onDurationChange,
  onSubmit,
  isRoutineStarted
}: TaskDialogProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full bg-ninja-accent text-white hover:bg-ninja-accent/90" disabled={isRoutineStarted}>
          <Plus className="w-4 h-4 mr-2" /> Add New Task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Task Name</label>
            <Input
              value={newTaskTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Enter task name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Duration (minutes)</label>
            <Input
              type="number"
              value={newTaskDuration}
              onChange={(e) => onDurationChange(e.target.value)}
              placeholder="Enter duration in minutes"
              min="1"
            />
          </div>
          <Button
            className="w-full bg-ninja-primary text-white hover:bg-ninja-primary/90"
            onClick={onSubmit}
          >
            {editingTask ? 'Update Task' : 'Add Task'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDialog;