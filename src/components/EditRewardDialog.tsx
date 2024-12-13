import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

interface EditRewardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reward: Database["public"]["Tables"]["rewards"]["Row"];
  onRewardUpdated: () => void;
  supabase: SupabaseClient;
}

export const EditRewardDialog = ({
  open,
  onOpenChange,
  reward,
  onRewardUpdated,
  supabase,
}: EditRewardDialogProps) => {
  const [title, setTitle] = useState(reward.title);
  const [baseTime, setBaseTime] = useState(reward.base_time);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase
      .from("rewards")
      .update({ title, base_time: baseTime })
      .eq("id", reward.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update reward",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Reward updated successfully",
    });
    onRewardUpdated();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Reward</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter reward title"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="baseTime">Base Time (minutes)</Label>
            <Input
              id="baseTime"
              type="number"
              value={baseTime}
              onChange={(e) => setBaseTime(Number(e.target.value))}
              min={1}
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Update Reward
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};