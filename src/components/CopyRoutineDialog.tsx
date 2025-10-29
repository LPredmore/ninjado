import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { SupabaseClient } from "@supabase/supabase-js";
import { Copy, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateRoutineQueries } from "@/lib/queryKeys";
import { logError } from "@/lib/errorLogger";

interface CopyRoutineDialogProps {
  routineId: string;
  routineTitle: string;
  routineStartTime?: string;
  supabase: SupabaseClient;
  userId: string;
}

const CopyRoutineDialog = ({
  routineId,
  routineTitle,
  routineStartTime,
  supabase,
  userId,
}: CopyRoutineDialogProps) => {
  const [open, setOpen] = useState(false);
  const [newTitle, setNewTitle] = useState(`Copy of ${routineTitle}`);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
const handleCopyRoutine = async () => {
  if (!newTitle.trim()) {
    toast.error("Please provide a title for the copied routine");
    return;
  }

  setIsSubmitting(true);
  try {
    // Create a new routine (use passed routineStartTime to avoid extra fetch)
    const { data: newRoutine, error: routineError } = await supabase
      .from("routines")
      .insert({
        title: newTitle,
        user_id: userId,
        start_time: routineStartTime || null,
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
      invalidateRoutineQueries(queryClient, userId);
    } catch (error) {
      logError("Failed to copy routine", error, {
        component: "CopyRoutineDialog",
        action: "handleCopyRoutine",
        routineId,
      });
      toast.error("Failed to copy routine");
    } finally {
      setIsSubmitting(false);
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
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter new routine title"
            />
            </div>
            <p className="text-sm text-muted-foreground">
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
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Copying...
              </>
            ) : (
              "Copy Routine"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CopyRoutineDialog;
