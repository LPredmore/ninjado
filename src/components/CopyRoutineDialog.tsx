
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { SupabaseClient } from "@supabase/supabase-js";
import { Copy } from "lucide-react";

interface CopyRoutineDialogProps {
  routineId: string;
  routineTitle: string;
  supabase: SupabaseClient;
  onCopyComplete: () => void;
}

const CopyRoutineDialog = ({
  routineId,
  routineTitle,
  supabase,
  onCopyComplete,
}: CopyRoutineDialogProps) => {
  const [open, setOpen] = useState(false);
  const [newTitle, setNewTitle] = useState(`Copy of ${routineTitle}`);
  const [isLoading, setIsLoading] = useState(false);

  // ...
const handleCopyRoutine = async () => {
  if (!newTitle.trim()) {
    toast.error("Please provide a title for the copied routine");
    return;
  }

  setIsLoading(true);
  try {
    // Fetch the original routine to copy start_time
    const { data: originalRoutine, error: routineFetchErr } = await supabase
      .from("routines")
      .select("start_time")
      .eq("id", routineId)
      .single();

    if (routineFetchErr) throw routineFetchErr;

    // 1. Create a new routine
    const { data: newRoutine, error: routineError } = await supabase
      .from("routines")
      .insert({
        title: newTitle,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        start_time: originalRoutine?.start_time ?? null,
      })
      .select()
      .single();

    if (routineError) throw routineError;
    
      // 2. Fetch tasks from original routine
      const { data: originalTasks, error: tasksError } = await supabase
        .from("routine_tasks")
        .select("*")
        .eq("routine_id", routineId)
        .order("position", { ascending: true });

      if (tasksError) throw tasksError;

      // 3. Create new tasks for the copied routine
      if (originalTasks.length > 0) {
        const newTasks = originalTasks.map((task) => ({
          routine_id: newRoutine.id,
          title: task.title,
          duration: task.duration,
          position: task.position,
          type: task.type,
        }));

        const { error: insertTasksError } = await supabase
          .from("routine_tasks")
          .insert(newTasks);

        if (insertTasksError) throw insertTasksError;
      }

      toast.success("Routine copied successfully!");
      setOpen(false);
      onCopyComplete();
    } catch (error) {
      console.error("Error copying routine:", error);
      toast.error("Failed to copy routine");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        size="sm"
        className="flex items-center gap-1"
      >
        <Copy className="h-4 w-4" />
        <span>Copy</span>
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Copy Routine</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">New Routine Title</label>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter new routine title"
            />
          </div>
          <p className="text-sm text-gray-500">
            This will create a copy of "{routineTitle}" with all its tasks.
          </p>
        </div>
        <DialogFooter>
          <Button
            onClick={() => setOpen(false)}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCopyRoutine}
            disabled={isLoading}
          >
            {isLoading ? "Copying..." : "Copy Routine"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CopyRoutineDialog;
