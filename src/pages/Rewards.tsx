import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { SupabaseClient } from "@supabase/supabase-js";
import SidebarLayout from "@/components/SidebarLayout";
import { RewardsList } from "@/components/RewardsList";
import { AddRewardDialog } from "@/components/AddRewardDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTimeTracking } from "@/contexts/TimeTrackingContext";

interface RewardsProps {
  user: User;
  supabase: SupabaseClient;
}

const Rewards = ({ user, supabase }: RewardsProps) => {
  const [isAddRewardOpen, setIsAddRewardOpen] = useState(false);
  const { totalTimeSaved } = useTimeTracking();

  const { data: rewards, refetch: refetchRewards } = useQuery({
    queryKey: ["rewards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rewards")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <SidebarLayout onSignOut={handleSignOut} totalTimeSaved={totalTimeSaved}>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Rewards</h1>
          <Button onClick={() => setIsAddRewardOpen(true)}>
            <Plus className="mr-2" />
            Add Reward
          </Button>
        </div>

        <RewardsList 
          rewards={rewards || []} 
          onRewardsChange={refetchRewards} 
          supabase={supabase} 
        />

        <AddRewardDialog
          open={isAddRewardOpen}
          onOpenChange={setIsAddRewardOpen}
          supabase={supabase}
          onRewardAdded={refetchRewards}
        />
      </div>
    </SidebarLayout>
  );
};

export default Rewards;