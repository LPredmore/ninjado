import { supabase } from "@/integrations/supabase/client";

// Belt rank system based on efficiency percentage
export interface BeltRank {
  color: string;
  name: string;
  emoji: string;
  minPercentage: number;
  maxPercentage: number;
  className: string; // Tailwind classes for styling
}

export interface EfficiencyStats {
  averageEfficiency: number | null;
  totalCompletions: number;
  currentBelt: BeltRank;
  hasEnoughData: boolean;
  last30Days: Array<{
    completed_at: string;
    efficiency_percentage: number | null;
  }>;
}

// Belt rank definitions
const BELT_RANKS: BeltRank[] = [
  {
    color: "white",
    name: "White Belt",
    emoji: "🤍",
    minPercentage: -Infinity,
    maxPercentage: 40,
    className: "bg-gray-100 text-gray-800 border-gray-300",
  },
  {
    color: "yellow",
    name: "Yellow Belt",
    emoji: "💛",
    minPercentage: 40,
    maxPercentage: 50,
    className: "bg-yellow-100 text-yellow-800 border-yellow-300",
  },
  {
    color: "orange",
    name: "Orange Belt",
    emoji: "🧡",
    minPercentage: 50,
    maxPercentage: 60,
    className: "bg-orange-100 text-orange-800 border-orange-300",
  },
  {
    color: "green",
    name: "Green Belt",
    emoji: "💚",
    minPercentage: 60,
    maxPercentage: 70,
    className: "bg-green-100 text-green-800 border-green-300",
  },
  {
    color: "blue",
    name: "Blue Belt",
    emoji: "💙",
    minPercentage: 70,
    maxPercentage: 75,
    className: "bg-blue-100 text-blue-800 border-blue-300",
  },
  {
    color: "purple",
    name: "Purple Belt",
    emoji: "💜",
    minPercentage: 75,
    maxPercentage: 80,
    className: "bg-purple-100 text-purple-800 border-purple-300",
  },
  {
    color: "brown",
    name: "Brown Belt",
    emoji: "🤎",
    minPercentage: 80,
    maxPercentage: 85,
    className: "bg-amber-100 text-amber-800 border-amber-300",
  },
  {
    color: "black",
    name: "Black Belt",
    emoji: "🖤",
    minPercentage: 85,
    maxPercentage: Infinity,
    className: "bg-gray-900 text-gray-100 border-gray-700",
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
 * Fetch user's efficiency stats from last 30 routine completions
 * @param userId - User ID
 * @returns Efficiency statistics
 */
export async function fetchUserEfficiencyStats(
  userId: string
): Promise<EfficiencyStats> {
  const { data, error } = await supabase
    .from("routine_completions")
    .select("completed_at, efficiency_percentage")
    .eq("user_id", userId)
    .eq("has_regular_tasks", true)
    .order("completed_at", { ascending: false })
    .limit(30);

  if (error) {
    console.error("Error fetching efficiency stats:", error);
    return {
      averageEfficiency: null,
      totalCompletions: 0,
      currentBelt: BELT_RANKS[0],
      hasEnoughData: false,
      last30Days: [],
    };
  }

  const completions = data || [];
  const totalCompletions = completions.length;
  const hasEnoughData = totalCompletions >= 30;

  // Calculate average efficiency (only from non-null values)
  const validEfficiencies = completions
    .map((c) => c.efficiency_percentage)
    .filter((e): e is number => e !== null);

  const averageEfficiency =
    validEfficiencies.length > 0
      ? validEfficiencies.reduce((sum, e) => sum + e, 0) / validEfficiencies.length
      : null;

  const currentBelt = getBeltRank(averageEfficiency, hasEnoughData);

  return {
    averageEfficiency,
    totalCompletions,
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
