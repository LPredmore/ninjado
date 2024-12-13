import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { SupabaseClient } from "@supabase/supabase-js";

interface AddRewardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRewardAdded: () => void;
  supabase: SupabaseClient;
}

export const AddRewardDialog = ({
  open,
  onOpenChange,
  onRewardAdded,
  supabase,
}: AddRewardDialogProps) => {
  const [title, setTitle] = useState("");
  const [baseTime, setBaseTime] = useState(30);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create rewards",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("rewards").insert({
      title,
      base_time: baseTime,
      user_id: user.id
    });

    if (error) {
      console.error("Error creating reward:", error);
      toast({
        title: "Error",
        description: "Failed to create reward",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Reward created successfully",
    });
    onRewardAdded();
    onOpenChange(false);
    setTitle("");
    setBaseTime(30);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Reward</DialogTitle>
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
            Create Reward
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};