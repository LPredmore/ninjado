import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { SupabaseClient } from "@supabase/supabase-js";
import { Clock, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateRoutineQueries } from "@/lib/queryKeys";
import { logError } from "@/lib/errorLogger";

interface AddRoutineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supabase: SupabaseClient;
  userId: string;
}

export const AddRoutineDialog = ({
  open,
  onOpenChange,
  supabase,
  userId,
}: AddRoutineDialogProps) => {
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("routines").insert({
        title,
        user_id: userId,
        start_time: startTime || null
      });

      if (error) throw error;

      toast.success("Routine created successfully!");
      setTitle("");
      setStartTime("");
      onOpenChange(false);
      invalidateRoutineQueries(queryClient, userId);
    } catch (error) {
      logError("Failed to create routine", error, {
        component: "AddRoutineDialog",
        action: "handleSubmit",
      });
      toast.error("Failed to create routine");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Routine</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Routine Title</label>
              <Input
                id="title"
                autoFocus
                placeholder="Routine title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Time (optional)</label>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
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
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Routine"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
