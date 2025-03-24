
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { SupabaseClient } from "@supabase/supabase-js";
import { Pencil } from "lucide-react";

interface EditRoutineDialogProps {
  routineId: string;
  routineTitle: string;
  supabase: SupabaseClient;
  onEditComplete: () => void;
}

const EditRoutineDialog = ({
  routineId,
  routineTitle,
  supabase,
  onEditComplete,
}: EditRoutineDialogProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(routineTitle);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Routine title cannot be empty");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("routines")
        .update({ title })
        .eq("id", routineId);

      if (error) throw error;

      toast.success("Routine updated successfully");
      setOpen(false);
      onEditComplete();
    } catch (error) {
      console.error("Error updating routine:", error);
      toast.error("Failed to update routine");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        onClick={() => setOpen(true)}
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
        <div className="py-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Routine title"
          />
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
