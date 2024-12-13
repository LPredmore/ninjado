import { useState } from "react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit2, Trash2, Gift } from "lucide-react";
import { EditRewardDialog } from "./EditRewardDialog";
import { useToast } from "@/components/ui/use-toast";
import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

interface RewardCardProps {
  reward: Database["public"]["Tables"]["rewards"]["Row"];
  onRewardChange: () => void;
  supabase: SupabaseClient;
}

export const RewardCard = ({ reward, onRewardChange, supabase }: RewardCardProps) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [redeemTime, setRedeemTime] = useState(reward.base_time);
  const { toast } = useToast();

  const handleDelete = async () => {
    const { error } = await supabase.from("rewards").delete().eq("id", reward.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete reward",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Reward deleted successfully",
    });
    onRewardChange();
  };

  const handleRedeem = async () => {
    const { data: timeData, error: timeError } = await supabase
      .from("task_completions")
      .select("time_saved")
      .eq("user_id", (await supabase.auth.getUser()).data.user?.id);

    if (timeError) {
      toast({
        title: "Error",
        description: "Failed to check available time",
        variant: "destructive",
      });
      return;
    }

    const totalTime = timeData.reduce((acc, curr) => acc + curr.time_saved, 0);
    const { data: redemptionsData } = await supabase
      .from("reward_redemptions")
      .select("time_spent");

    const spentTime = redemptionsData?.reduce((acc, curr) => acc + curr.time_spent, 0) || 0;
    const availableTime = totalTime - spentTime;

    if (redeemTime > availableTime) {
      toast({
        title: "Error",
        description: "Not enough time available",
        variant: "destructive",
      });
      return;
    }

    const { error: redemptionError } = await supabase.from("reward_redemptions").insert({
      reward_id: reward.id,
      time_spent: redeemTime,
    });

    if (redemptionError) {
      toast({
        title: "Error",
        description: "Failed to redeem reward",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Reward redeemed successfully",
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="font-semibold text-lg">{reward.title}</h3>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => setIsEditOpen(true)}>
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDelete}>
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
        <Button className="w-full" onClick={handleRedeem}>
          <Gift className="mr-2 h-4 w-4" />
          Redeem
        </Button>
      </CardFooter>

      <EditRewardDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        reward={reward}
        onRewardUpdated={onRewardChange}
        supabase={supabase}
      />
    </Card>
  );
};