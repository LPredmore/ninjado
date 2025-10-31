import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  fetchUserEfficiencyStats, 
  getBeltProgressPercentage, 
  getAllBeltRanks,
  type BeltRank,
  type EfficiencyStats 
} from "@/lib/efficiencyUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import { useEffect, useState } from "react";
import confetti from "canvas-confetti";

interface EfficiencyBadgeProps {
  userId: string;
  variant?: "hero" | "full" | "compact";
}

export const EfficiencyBadge = ({ userId, variant = "hero" }: EfficiencyBadgeProps) => {
  const [lastBeltRank, setLastBeltRank] = useState<string | null>(null);

  // Fetch username from profiles
  const { data: profile } = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", userId)
        .single();
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch efficiency stats
  const { data: stats, isLoading, error } = useQuery<EfficiencyStats>({
    queryKey: ["efficiency-stats", userId],
    queryFn: () => fetchUserEfficiencyStats(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Check for belt rank achievement and trigger celebration
  useEffect(() => {
    if (!stats) return;
    
    const storedBelt = localStorage.getItem(`last-belt-${userId}`);
    
    if (storedBelt && storedBelt !== stats.currentBelt.name) {
      // Belt rank increased - celebrate!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      const allBelts = getAllBeltRanks();
      const currentIndex = allBelts.findIndex(b => b.name === stats.currentBelt.name);
      
      if (currentIndex > 0) {
        const nextBelt = allBelts[currentIndex];
        // Show celebration toast - would need toast context
      }
    }
    
    setLastBeltRank(stats.currentBelt.name);
    localStorage.setItem(`last-belt-${userId}`, stats.currentBelt.name);
  }, [stats, userId]);

  if (isLoading) {
    return <EfficiencyBadgeSkeleton variant={variant} />;
  }

  if (error || !stats) {
    return null;
  }

  const username = profile?.username || "Ninja";
  const progressToNext = getBeltProgressPercentage(
    stats.averageEfficiency || 0, 
    stats.currentBelt
  );

  if (variant === "compact") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 clay-element-with-transition px-3 py-2 rounded-xl cursor-pointer hover:scale-105">
              <span className="text-2xl">{stats.currentBelt.emoji}</span>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground">
                  {stats.averageEfficiency?.toFixed(1)}%
                </span>
                {stats.hasEnoughData && (
                  <TrendIcon efficiency={stats.averageEfficiency || 0} />
                )}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-semibold">{stats.currentBelt.name} Belt</p>
              <p className="text-xs text-muted-foreground">
                {progressToNext.toFixed(0)}% to next belt
              </p>
              {stats.penalty > 0 && (
                <p className="text-xs text-destructive">
                  Penalty: -{stats.penalty.toFixed(1)}% ({stats.overrunCount} overruns)
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === "full") {
    return (
      <div className="space-y-6">
        {/* Main Stats Card */}
        <div className={`clay-element p-6 rounded-2xl ${stats.currentBelt.gradientClass} relative overflow-hidden`}>
          {stats.currentBelt.name === "Grandmaster" && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
          )}
          
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Belt Display */}
            <div className="relative">
              <div className={`w-24 h-24 clay-element-with-transition rounded-full flex items-center justify-center ${stats.averageEfficiency && stats.averageEfficiency > 80 ? 'animate-pulse' : ''}`}>
                <span className="text-6xl">{stats.currentBelt.emoji}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex-1 text-center md:text-left space-y-2">
              <h2 className="text-3xl font-bold text-foreground">
                {username}
              </h2>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <Badge className={`text-lg px-4 py-1 ${stats.currentBelt.badgeClass}`}>
                  {stats.currentBelt.name} Belt
                </Badge>
                <span className="text-4xl font-bold text-foreground">
                  {stats.averageEfficiency?.toFixed(1)}%
                </span>
              </div>
              
              {!stats.hasEnoughData && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                  <Info className="w-4 h-4" />
                  <span>{stats.completionCount}/30 missions complete</span>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {stats.hasEnoughData && stats.currentBelt.name !== "Grandmaster" && (
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress to next belt</span>
                <span className="font-semibold text-foreground">{progressToNext.toFixed(0)}%</span>
              </div>
              <Progress value={progressToNext} className="h-3" />
            </div>
          )}

          {/* Penalty Breakdown */}
          {stats.penalty > 0 && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-xl">⚠️</span>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-semibold text-destructive">
                    Penalty Applied: -{stats.penalty.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stats.overrunCount} overruns detected (4+ overruns incur penalties)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Raw efficiency: {stats.rawAverageEfficiency?.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Belt Progression Legend */}
        <div className="clay-element p-6 rounded-2xl space-y-4">
          <h3 className="text-xl font-bold text-foreground">Belt Progression</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {getAllBeltRanks().map((belt) => (
              <div
                key={belt.name}
                className={`p-3 rounded-lg border-2 transition-all ${
                  belt.name === stats.currentBelt.name
                    ? 'border-primary bg-primary/10 scale-105'
                    : 'border-border/50 bg-background/50'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <span className="text-3xl">{belt.emoji}</span>
                  <span className="text-xs font-semibold text-center">{belt.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {belt.minPercentage}-{belt.maxPercentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Hero variant
  return (
    <div className={`clay-element p-6 rounded-2xl ${stats.currentBelt.gradientClass} relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300`}>
      {stats.currentBelt.name === "Grandmaster" && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/10 to-transparent sparkle-border" />
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Belt Display */}
        <div className="relative">
          <div className={`w-20 h-20 clay-element-with-transition rounded-full flex items-center justify-center ${stats.averageEfficiency && stats.averageEfficiency > 80 ? 'animate-bounce' : ''} glow-jade`}>
            <span className="text-6xl drop-shadow-lg">{stats.currentBelt.emoji}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 text-center sm:text-left space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
            {username}
          </h2>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <Badge className={`text-base px-3 py-1 ${stats.currentBelt.badgeClass}`}>
              {stats.currentBelt.name}
            </Badge>
            <span className="text-3xl font-bold text-foreground drop-shadow-md">
              {stats.averageEfficiency?.toFixed(1)}%
            </span>
          </div>
          
          {!stats.hasEnoughData && (
            <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-muted-foreground mt-2">
              <Info className="w-4 h-4" />
              <span>{stats.completionCount}/30 missions complete</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {stats.hasEnoughData && stats.currentBelt.name !== "Grandmaster" && (
        <div className="mt-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress to next belt</span>
            <span className="font-semibold text-foreground">{progressToNext.toFixed(0)}%</span>
          </div>
          <Progress value={progressToNext} className="h-2" />
        </div>
      )}
    </div>
  );
};

const TrendIcon = ({ efficiency }: { efficiency: number }) => {
  if (efficiency > 75) return <TrendingUp className="w-3 h-3 text-success" />;
  if (efficiency < 60) return <TrendingDown className="w-3 h-3 text-destructive" />;
  return <Minus className="w-3 h-3 text-muted-foreground" />;
};

const EfficiencyBadgeSkeleton = ({ variant }: { variant: "hero" | "full" | "compact" }) => {
  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2 clay-element px-3 py-2 rounded-xl">
        <Skeleton className="w-8 h-8 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="w-12 h-4" />
          <Skeleton className="w-8 h-3" />
        </div>
      </div>
    );
  }

  return (
    <div className="clay-element p-6 rounded-2xl">
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <Skeleton className="w-20 h-20 rounded-full" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-8 w-32" />
          <div className="flex gap-3">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
};
