import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { SupabaseClient } from "@supabase/supabase-js";
import { Pencil, Clock, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateRoutineQueries } from "@/lib/queryKeys";
import { logError } from "@/lib/errorLogger";

interface EditRoutineDialogProps {
  routineId: string;
  routineTitle: string;
  routineStartTime?: string;
  supabase: SupabaseClient;
  userId: string;
}

const EditRoutineDialog = ({
  routineId,
  routineTitle,
  routineStartTime,
  supabase,
  userId,
}: EditRoutineDialogProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(routineTitle);
  const [startTime, setStartTime] = useState(routineStartTime || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Routine title cannot be empty");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("routines")
        .update({
          title,
          start_time: startTime || null,
        })
        .eq("id", routineId);

      if (error) throw error;

      toast.success("Routine updated successfully");
      setOpen(false);
      invalidateRoutineQueries(queryClient, userId);
    } catch (error) {
      logError("Failed to update routine", error, {
        component: "EditRoutineDialog",
        action: "handleSave",
        routineId,
      });
      toast.error("Failed to update routine");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      // Reset form when opening
      setTitle(routineTitle);
      setStartTime(routineStartTime || "");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        aria-label="Edit routine"
      >
        <Pencil className="h-4 w-4 text-muted-foreground" />
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Routine</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Routine Title</label>
            <Input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Routine title"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Start Time</label>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="Start time"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Set the time when you usually start this routine
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => setOpen(false)} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditRoutineDialog;
