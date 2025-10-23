import { useState, memo } from "react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Edit2, Trash2, Gift, Loader2 } from "lucide-react";
import { EditRewardDialog } from "./EditRewardDialog";
import { toast } from "sonner";
import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { useTimeTracking } from "@/contexts/TimeTrackingContext";

interface RewardCardProps {
  reward: Database["public"]["Tables"]["rewards"]["Row"];
  onRewardChange: () => void;
  supabase: SupabaseClient;
}

const RewardCardComponent = ({ reward, onRewardChange, supabase }: RewardCardProps) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [redeemTime, setRedeemTime] = useState(reward.base_time);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const { totalTimeSaved, refreshTotalTimeSaved } = useTimeTracking();

  const handleDelete = async () => {
    const { error } = await supabase.from("rewards").delete().eq("id", reward.id);

    if (error) {
      console.error("Error deleting reward:", error);
      toast.error("Failed to delete reward");
      return;
    }

    toast.success("Reward deleted successfully");
    onRewardChange();
    setIsDeleteOpen(false);
  };

  const handleRedeem = async () => {
    setIsRedeeming(true);
    
    try {
      // Get user once and reuse
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to redeem rewards");
        return;
      }

      const userId = user.id;

      // Get total time saved from task completions
      const { data: timeData, error: timeError } = await supabase
        .from("task_completions")
        .select("time_saved")
        .eq("user_id", userId);

      if (timeError) {
        console.error("Error checking available time:", timeError);
        toast.error("Failed to check available time");
        return;
      }

      const totalTimeSaved = timeData.reduce((acc, curr) => acc + curr.time_saved, 0);

      // Get total time already spent on rewards
      const { data: redemptionsData, error: redemptionsError } = await supabase
        .from("reward_redemptions")
        .select("time_spent")
        .eq("user_id", userId);

      if (redemptionsError) {
        console.error("Error checking redemption history:", redemptionsError);
        toast.error("Failed to check redemption history");
        return;
      }

      const totalTimeSpent = redemptionsData.reduce((acc, curr) => acc + curr.time_spent, 0);
      const availableTime = totalTimeSaved - totalTimeSpent;

      // Convert minutes to seconds for comparison
      const redeemTimeInSeconds = redeemTime * 60;

      if (redeemTimeInSeconds > availableTime) {
        toast.error(`Not enough time available. You have ${Math.floor(availableTime / 60)} minutes available.`);
        return;
      }

      const { error: redemptionError } = await supabase
        .from("reward_redemptions")
        .insert({
          reward_id: reward.id,
          time_spent: redeemTimeInSeconds,
          user_id: userId
        });

      if (redemptionError) {
        console.error("Error redeeming reward:", redemptionError);
        toast.error("Failed to redeem reward");
        return;
      }

      toast.success(`Successfully redeemed ${redeemTime} minutes for "${reward.title}"`);
      onRewardChange();
      refreshTotalTimeSaved();
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="font-semibold text-lg">{reward.title}</h3>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsEditOpen(true)}
            aria-label="Edit reward"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsDeleteOpen(true)}
            aria-label="Delete reward"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={redeemTime}
            onChange={(e) => setRedeemTime(Number(e.target.value))}
            min={1}
            className="w-24"
          />
          <span>minutes</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={handleRedeem}
          disabled={isRedeeming}
        >
          {isRedeeming ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Redeeming...
            </>
          ) : (
            <>
              <Gift className="mr-2 h-4 w-4" />
              Redeem
            </>
          )}
        </Button>
      </CardFooter>

      <EditRewardDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        reward={reward}
        onRewardUpdated={onRewardChange}
        supabase={supabase}
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reward?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{reward.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export const RewardCard = memo(RewardCardComponent);