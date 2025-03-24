
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { SupabaseClient } from "@supabase/supabase-js";
import { Pencil } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditTaskDialogProps {
  taskId: string;
  task: {
    title: string;
    duration: number;
    type?: 'regular' | 'focus';
  };
  supabase: SupabaseClient;
  onEditComplete: () => void;
}

const EditTaskDialog = ({
  taskId,
  task,
  supabase,
  onEditComplete,
}: EditTaskDialogProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [duration, setDuration] = useState(task.duration.toString());
  const [taskType, setTaskType] = useState<'regular' | 'focus'>(task.type || 'regular');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || !duration.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("routine_tasks")
        .update({
          title,
          duration: parseInt(duration),
          type: taskType
        })
        .eq("id", taskId);

      if (error) throw error;

      toast.success("Task updated successfully");
      setOpen(false);
      onEditComplete();
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
      >
        <Pencil className="h-4 w-4 text-gray-500" />
      </Button>
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Task Name</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Duration (minutes)</label>
            <Input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
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
                <SelectItem value="regular">Regular Task</SelectItem>
                <SelectItem value="focus">Focus Task</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => setOpen(false)}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditTaskDialog;
