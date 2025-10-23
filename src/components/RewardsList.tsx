import { RewardCard } from "./RewardCard";
import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { Gift } from "lucide-react";

interface RewardsListProps {
  rewards: Database["public"]["Tables"]["rewards"]["Row"][];
  onRewardsChange: () => void;
  supabase: SupabaseClient;
}

export const RewardsList = ({ rewards, onRewardsChange, supabase }: RewardsListProps) => {
  if (rewards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Gift className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No rewards yet</h3>
        <p className="text-muted-foreground">
          Create your first reward to start redeeming your saved time!
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {rewards.map((reward) => (
        <RewardCard
          key={reward.id}
          reward={reward}
          onRewardChange={onRewardsChange}
          supabase={supabase}
        />
      ))}
    </div>
  );
};