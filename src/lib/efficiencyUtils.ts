import { supabase } from "@/integrations/supabase/client";

// Belt rank system based on efficiency percentage
export interface BeltRank {
  color: string;
  name: string;
  imageUrl: string;
  minPercentage: number;
  maxPercentage: number;
  className: string; // Tailwind classes for styling
  gradientClass: string; // Background gradient classes
  badgeClass: string; // Badge styling classes
}

export interface EfficiencyStats {
  averageEfficiency: number | null; // Final efficiency after penalty
  rawAverageEfficiency: number | null; // Before penalty
  penalty: number; // Penalty amount deducted
  overrunCount: number; // Number of overruns detected
  completionCount: number; // Total completions in last 30 days
  currentBelt: BeltRank;
  hasEnoughData: boolean;
  last30Days: Array<{
    completed_at: string;
    efficiency_percentage: number | null;
    total_time_saved: number;
  }>;
}

// Belt rank definitions - Updated ranges
const BELT_RANKS: BeltRank[] = [
  {
    color: "white",
    name: "Beginner",
    imageUrl: "/lovable-uploads/belt-white.png",
    minPercentage: -Infinity,
    maxPercentage: 40,
    className: "bg-gray-100 text-gray-800 border-gray-300",
    gradientClass: "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900",
    badgeClass: "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200",
  },
  {
    color: "yellow",
    name: "Novice",
    imageUrl: "/lovable-uploads/belt-yellow.png",
    minPercentage: 40,
    maxPercentage: 50,
    className: "bg-yellow-100 text-yellow-800 border-yellow-300",
    gradientClass: "bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30",
    badgeClass: "bg-yellow-200 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200",
  },
  {
    color: "orange",
    name: "Apprentice",
    imageUrl: "/lovable-uploads/belt-orange.png",
    minPercentage: 50,
    maxPercentage: 60,
    className: "bg-orange-100 text-orange-800 border-orange-300",
    gradientClass: "bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30",
    badgeClass: "bg-orange-200 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200",
  },
  {
    color: "green",
    name: "Skilled",
    imageUrl: "/lovable-uploads/belt-green.png",
    minPercentage: 60,
    maxPercentage: 70,
    className: "bg-green-100 text-green-800 border-green-300",
    gradientClass: "bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30",
    badgeClass: "bg-green-200 text-green-800 dark:bg-green-900/50 dark:text-green-200",
  },
  {
    color: "blue",
    name: "Advanced",
    imageUrl: "/lovable-uploads/belt-blue.png",
    minPercentage: 70,
    maxPercentage: 75,
    className: "bg-blue-100 text-blue-800 border-blue-300",
    gradientClass: "bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30",
    badgeClass: "bg-blue-200 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200",
  },
  {
    color: "purple",
    name: "Expert",
    imageUrl: "/lovable-uploads/belt-purple.png",
    minPercentage: 75,
    maxPercentage: 80,
    className: "bg-purple-100 text-purple-800 border-purple-300",
    gradientClass: "bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30",
    badgeClass: "bg-purple-200 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200",
  },
  {
    color: "brown",
    name: "Master",
    imageUrl: "/lovable-uploads/belt-brown.png",
    minPercentage: 80,
    maxPercentage: 85,
    className: "bg-amber-100 text-amber-800 border-amber-300",
    gradientClass: "bg-gradient-to-br from-amber-200 to-amber-300 dark:from-amber-900/30 dark:to-amber-800/30",
    badgeClass: "bg-amber-300 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200",
  },
  {
    color: "black",
    name: "Grandmaster",
    imageUrl: "/lovable-uploads/belt-black.png",
    minPercentage: 85,
    maxPercentage: Infinity,
    className: "bg-gray-900 text-gray-100 border-gray-700",
    gradientClass: "bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-100 dark:to-gray-300",
    badgeClass: "bg-gray-900 text-gray-100 dark:bg-gray-100 dark:text-gray-900",
  },
];

/**
 * Calculate efficiency percentage from time saved and total duration
 * @param timeSaved - Total time saved in seconds (can be negative)
 * @param totalDuration - Total routine duration in seconds
 * @returns Efficiency percentage or null if division by zero
 */
export function calculateEfficiencyPercentage(
  timeSaved: number,
  totalDuration: number
): number | null {
  if (totalDuration === 0) {
    return null;
  }
  return (timeSaved / totalDuration) * 100;
}

/**
 * Get belt rank based on efficiency percentage
 * @param percentage - Efficiency percentage (can be negative)
 * @param hasEnoughData - Whether user has completed enough routines (30+)
 * @returns Belt rank object
 */
export function getBeltRank(
  percentage: number | null,
  hasEnoughData: boolean
): BeltRank {
  // Return white belt if not enough data or null percentage
  if (!hasEnoughData || percentage === null) {
    return BELT_RANKS[0]; // White Belt
  }

  // Find the appropriate belt rank
  for (let i = BELT_RANKS.length - 1; i >= 0; i--) {
    const belt = BELT_RANKS[i];
    if (percentage >= belt.minPercentage && percentage < belt.maxPercentage) {
      return belt;
    }
  }

  // Default to white belt if no match (shouldn't happen)
  return BELT_RANKS[0];
}

/**
 * Calculate overrun penalty based on number of times user went over routine time
 * @param completions - Last 30 completions with total_time_saved
 * @returns Penalty percentage to deduct from efficiency score
 */
export function calculateOverrunPenalty(
  completions: Array<{ total_time_saved: number }>
): { penalty: number; overrunCount: number } {
  const overrunCount = completions.filter((c) => c.total_time_saved < 0).length;

  // Forgiveness threshold: 0-3 overruns are ignored
  if (overrunCount <= 3) {
    return { penalty: 0, overrunCount };
  }

  // Penalty formula: overrunCount × 1.5
  // Cap at 50% to prevent extreme negatives
  const penalty = Math.min(overrunCount * 1.5, 50);

  return { penalty, overrunCount };
}

/**
 * Fetch user's efficiency stats from last 30 routine completions
 * @param userId - User ID
 * @returns Efficiency statistics with overrun penalty applied
 */
export async function fetchUserEfficiencyStats(
  userId: string
): Promise<EfficiencyStats> {
  const { data, error } = await supabase
    .from("routine_completions")
    .select("completed_at, efficiency_percentage, total_time_saved")
    .eq("user_id", userId)
    .eq("has_regular_tasks", true)
    .order("completed_at", { ascending: false })
    .limit(30);

  if (error) {
    console.error("Error fetching efficiency stats:", error);
    return {
      averageEfficiency: null,
      rawAverageEfficiency: null,
      penalty: 0,
      overrunCount: 0,
      completionCount: 0,
      currentBelt: BELT_RANKS[0],
      hasEnoughData: false,
      last30Days: [],
    };
  }

  const completions = data || [];
  const totalCompletions = completions.length;
  const hasEnoughData = totalCompletions >= 30;

  // Calculate raw average efficiency (only from non-null values)
  const validEfficiencies = completions
    .map((c) => c.efficiency_percentage)
    .filter((e): e is number => e !== null);

  const rawAverageEfficiency =
    validEfficiencies.length > 0
      ? validEfficiencies.reduce((sum, e) => sum + e, 0) / validEfficiencies.length
      : null;

  // Calculate overrun penalty
  const { penalty, overrunCount } = calculateOverrunPenalty(completions);

  // Apply penalty to get final efficiency
  const averageEfficiency =
    rawAverageEfficiency !== null ? rawAverageEfficiency - penalty : null;

  const currentBelt = getBeltRank(averageEfficiency, hasEnoughData);

  return {
    averageEfficiency,
    rawAverageEfficiency,
    penalty,
    overrunCount,
    completionCount: totalCompletions,
    currentBelt,
    hasEnoughData,
    last30Days: completions,
  };
}

/**
 * Calculate progress percentage toward next belt level
 * @param currentEfficiency - Current efficiency percentage
 * @param currentBelt - Current belt rank
 * @returns Progress percentage (0-100)
 */
export function getBeltProgressPercentage(
  currentEfficiency: number,
  currentBelt: BeltRank
): number {
  const beltIndex = BELT_RANKS.findIndex((b) => b.color === currentBelt.color);
  
  // If at max belt (Black Belt), return 100%
  if (beltIndex === BELT_RANKS.length - 1) {
    return 100;
  }

  const nextBelt = BELT_RANKS[beltIndex + 1];
  const currentMin = currentBelt.minPercentage;
  const currentMax = currentBelt.maxPercentage;
  const range = currentMax - currentMin;

  // Calculate progress within current belt
  const progress = ((currentEfficiency - currentMin) / range) * 100;

  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, progress));
}

/**
 * Get all belt ranks (for UI display)
 * @returns Array of all belt ranks
 */
export function getAllBeltRanks(): BeltRank[] {
  return BELT_RANKS;
}
