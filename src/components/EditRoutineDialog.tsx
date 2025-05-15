
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { SupabaseClient } from "@supabase/supabase-js";
import { Pencil, Clock } from "lucide-react";

interface EditRoutineDialogProps {
  routineId: string;
  routineTitle: string;
  routineStartTime?: string;
  supabase: SupabaseClient;
  onEditComplete: () => void;
}

const EditRoutineDialog = ({
  routineId,
  routineTitle,
  routineStartTime,
  supabase,
  onEditComplete,
}: EditRoutineDialogProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(routineTitle);
  const [startTime, setStartTime] = useState(routineStartTime || "");
  const [isLoading, setIsLoading] = useState(false);
  
  // Update local state when props change
  useEffect(() => {
    setTitle(routineTitle);
    setStartTime(routineStartTime || "");
  }, [routineTitle, routineStartTime, open]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Routine title cannot be empty",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log("Updating routine with data:", { title, start_time: startTime || null });
      
      const { error } = await supabase
        .from("routines")
        .update({ 
          title,
          start_time: startTime || null 
        })
        .eq("id", routineId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Routine updated successfully"
      });
      setOpen(false);
      onEditComplete();
    } catch (error) {
      console.error("Error updating routine:", error);
      toast({
        title: "Error",
        description: "Failed to update routine",
        variant: "destructive"
      });
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Routine</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Routine Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Routine title"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Start Time</label>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="Start time"
              />
            </div>
            <p className="text-xs text-gray-500">
              Set the time when you usually start this routine
            </p>
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

export default EditRoutineDialog;
