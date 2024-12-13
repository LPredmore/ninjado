import { RewardCard } from "./RewardCard";
import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

interface RewardsListProps {
  rewards: Database["public"]["Tables"]["rewards"]["Row"][];
  onRewardsChange: () => void;
  supabase: SupabaseClient;
}

export const RewardsList = ({ rewards, onRewardsChange, supabase }: RewardsListProps) => {
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