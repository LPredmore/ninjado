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
  averageEfficiency: number | null; // Final efficiency after Grace System penalty
  finalEfficiency: number | null; // Same as averageEfficiency for backward compatibility
  graceSystemPenalty: number; // Grace System penalty amount
  negativeRoutineCount: number; // Number of negative routines in past 30 days
  completionCount: number; // Total completions in last 30 days
  currentBelt: BeltRank;
  hasEnoughData: boolean;
  last30Days: Array<{
    completed_at: string;
    efficiency_percentage: number | null;
    total_time_saved: number;
  }>;
}

// Belt rank definitions - Optimized for new efficiency scoring system
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
 * Calculate efficiency percentage from time saved and actual time spent
 * @param timeSaved - Total time saved in seconds (can be negative)
 * @param actualTimeSpent - Actual time spent on tasks in seconds
 * @returns Efficiency percentage or null if division by zero
 */
export function calculateEfficiencyPercentage(
  timeSaved: number,
  actualTimeSpent: number
): number | null {
  if (actualTimeSpent === 0) {
    return null;
  }
  return (timeSaved / actualTimeSpent) * 100;
}

/**
 * Task completion interface for new efficiency calculation
 */
export interface TaskCompletion {
  type: 'regular' | 'focus';
  plannedDuration: number; // seconds
  actualDuration: number; // seconds
}

/**
 * Result interface for routine efficiency calculation
 */
export interface RoutineEfficiencyResult {
  efficiency: number | null; // The calculated efficiency score
  breakdown: {
    totalRegularActual: number;
    totalRegularPlanned: number;
    ratio: number;
    isFasterThanPlanned: boolean;
  };
}

/**
 * Result interface for overall efficiency calculation with Grace System
 */
export interface OverallEfficiencyResult {
  averageEfficiency: number;
  graceSystemPenalty: number;
  finalEfficiency: number;
  negativeRoutineCount: number;
}

/**
 * Calculate routine efficiency using the new ratio-based formula
 * Formula: ratio = actual_time_regular_tasks / total_planned_time_regular_tasks
 * If ratio < 1 (faster than planned): efficiency = ratio
 * If ratio >= 1 (slower than planned): efficiency = 1 - ratio
 * Focus tasks are ignored in efficiency calculation
 * 
 * @param tasks - Array of task completions with type, planned and actual durations
 * @returns Efficiency calculation result with breakdown
 */
export function calculateRoutineEfficiency(
  tasks: TaskCompletion[]
): RoutineEfficiencyResult {
  let totalRegularPlanned = 0;
  let totalRegularActual = 0;

  // Process only regular tasks for efficiency calculation
  for (const task of tasks) {
    if (task.type === 'regular') {
      totalRegularPlanned += task.plannedDuration;
      totalRegularActual += task.actualDuration;
    }
    // Focus tasks are ignored in efficiency calculation
  }

  // Return null efficiency if no regular tasks or zero planned time
  if (totalRegularPlanned === 0 || totalRegularActual === 0) {
    return {
      efficiency: null,
      breakdown: {
        totalRegularActual,
        totalRegularPlanned,
        ratio: 0,
        isFasterThanPlanned: false,
      },
    };
  }

  // Calculate ratio: actual_time / planned_time
  const ratio = totalRegularActual / totalRegularPlanned;
  const isFasterThanPlanned = ratio < 1;

  // Apply conditional logic based on ratio
  let efficiency: number;
  if (ratio < 1) {
    // Faster than planned: efficiency = ratio
    efficiency = ratio;
  } else {
    // Slower than planned: efficiency = 1 - ratio
    efficiency = 1 - ratio;
  }

  return {
    efficiency,
    breakdown: {
      totalRegularActual,
      totalRegularPlanned,
      ratio,
      isFasterThanPlanned,
    },
  };
}

/**
 * Calculate overall efficiency with Grace System penalty
 * Grace System Rules:
 * - If ≤ 3 negative routines: no penalty
 * - If ≥ 4 negative routines: penalty = 2 × sum of all negative efficiency scores
 * 
 * @param routineEfficiencies - Array of efficiency scores from past 30 days
 * @returns Overall efficiency calculation with Grace System applied
 */
export function calculateOverallEfficiency(
  routineEfficiencies: number[]
): OverallEfficiencyResult {
  // Calculate average efficiency from all routine scores
  const averageEfficiency = routineEfficiencies.length > 0
    ? routineEfficiencies.reduce((sum, efficiency) => sum + efficiency, 0) / routineEfficiencies.length
    : 0;

  // Count routines with negative efficiency ratings
  const negativeEfficiencies = routineEfficiencies.filter(efficiency => efficiency < 0);
  const negativeRoutineCount = negativeEfficiencies.length;

  // Apply Grace System penalty logic
  let graceSystemPenalty = 0;
  
  if (negativeRoutineCount >= 4) {
    // Calculate penalty: 2 × sum of all negative efficiency scores
    const sumOfNegativeScores = negativeEfficiencies.reduce((sum, efficiency) => sum + efficiency, 0);
    graceSystemPenalty = 2 * Math.abs(sumOfNegativeScores); // Make penalty positive
  }
  // If ≤ 3 negative routines: no penalty (graceSystemPenalty remains 0)

  // Apply penalty to average efficiency for final rating
  const finalEfficiency = averageEfficiency - graceSystemPenalty;

  return {
    averageEfficiency,
    graceSystemPenalty,
    finalEfficiency,
    negativeRoutineCount,
  };
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
 * Updated for new efficiency scoring system with adjusted penalty rates
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

  // Updated penalty formula for new scoring system:
  // Reduced penalty rate since new system produces higher efficiency scores
  // Penalty formula: (overrunCount - 3) × 1.0 (reduced from 1.5)
  // Cap at 30% to maintain meaningful belt progression (reduced from 50%)
  const penalty = Math.min((overrunCount - 3) * 1.0, 30);

  return { penalty, overrunCount };
}

/**
 * Fetch user's efficiency stats from last 30 routine completions
 * Uses new ratio-based calculation with Grace System for overall user rating
 * Handles backward compatibility with existing data that may have null efficiency values
 * @param userId - User ID
 * @returns Efficiency statistics with Grace System penalty applied
 */
export async function fetchUserEfficiencyStats(
  userId: string
): Promise<EfficiencyStats> {
  const { data, error } = await supabase
    .from("routine_completions")
    .select("completed_at, efficiency_percentage, total_time_saved, total_routine_duration")
    .eq("user_id", userId)
    .eq("has_regular_tasks", true)
    .order("completed_at", { ascending: false })
    .limit(30);

  if (error) {
    console.error("Error fetching efficiency stats:", error);
    return {
      averageEfficiency: null,
      finalEfficiency: null,
      graceSystemPenalty: 0,
      negativeRoutineCount: 0,
      completionCount: 0,
      currentBelt: BELT_RANKS[0],
      hasEnoughData: false,
      last30Days: [],
    };
  }

  const completions = data || [];
  const totalCompletions = completions.length;
  const hasEnoughData = totalCompletions >= 30;

  // Handle backward compatibility: calculate efficiency for records with null efficiency_percentage
  // but valid total_time_saved and total_routine_duration
  const processedCompletions = completions.map((completion) => {
    if (completion.efficiency_percentage === null && 
        completion.total_time_saved !== null && 
        completion.total_routine_duration !== null &&
        completion.total_routine_duration > 0) {
      // Use legacy formula for backward compatibility: (time_saved / routine_duration) * 100
      const legacyEfficiency = (completion.total_time_saved / completion.total_routine_duration) * 100;
      return {
        ...completion,
        efficiency_percentage: legacyEfficiency,
      };
    }
    return completion;
  });

  // Get valid efficiency scores for Grace System calculation
  const validEfficiencies = processedCompletions
    .map((c) => c.efficiency_percentage)
    .filter((e): e is number => e !== null);

  if (validEfficiencies.length === 0) {
    return {
      averageEfficiency: null,
      finalEfficiency: null,
      graceSystemPenalty: 0,
      negativeRoutineCount: 0,
      completionCount: totalCompletions,
      currentBelt: BELT_RANKS[0],
      hasEnoughData,
      last30Days: processedCompletions,
    };
  }

  // Apply Grace System calculation for overall user rating
  const graceSystemResult = calculateOverallEfficiency(validEfficiencies);

  const currentBelt = getBeltRank(graceSystemResult.finalEfficiency, hasEnoughData);

  return {
    averageEfficiency: graceSystemResult.finalEfficiency,
    finalEfficiency: graceSystemResult.finalEfficiency,
    graceSystemPenalty: graceSystemResult.graceSystemPenalty,
    negativeRoutineCount: graceSystemResult.negativeRoutineCount,
    completionCount: totalCompletions,
    currentBelt,
    hasEnoughData,
    last30Days: processedCompletions,
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

/**
 * Migration utility to backfill efficiency percentages for existing routine completions
 * This function can be called to update historical data with calculated efficiency values
 * @param userId - User ID to migrate data for
 * @returns Promise with migration results
 */
export async function migrateHistoricalEfficiencyData(
  userId: string
): Promise<{ updated: number; errors: number }> {
  let updated = 0;
  let errors = 0;

  try {
    // Fetch completions with null efficiency but valid time data
    const { data: completions, error: fetchError } = await supabase
      .from("routine_completions")
      .select("id, total_time_saved, total_routine_duration")
      .eq("user_id", userId)
      .is("efficiency_percentage", null)
      .not("total_time_saved", "is", null)
      .not("total_routine_duration", "is", null)
      .gt("total_routine_duration", 0);

    if (fetchError) {
      console.error("Error fetching completions for migration:", fetchError);
      return { updated: 0, errors: 1 };
    }

    if (!completions || completions.length === 0) {
      return { updated: 0, errors: 0 };
    }

    // Update each completion with calculated efficiency
    for (const completion of completions) {
      try {
        const efficiency = (completion.total_time_saved / completion.total_routine_duration) * 100;
        
        const { error: updateError } = await supabase
          .from("routine_completions")
          .update({ efficiency_percentage: efficiency })
          .eq("id", completion.id);

        if (updateError) {
          console.error(`Error updating completion ${completion.id}:`, updateError);
          errors++;
        } else {
          updated++;
        }
      } catch (error) {
        console.error(`Error processing completion ${completion.id}:`, error);
        errors++;
      }
    }

    console.log(`Migration completed: ${updated} records updated, ${errors} errors`);
    return { updated, errors };
  } catch (error) {
    console.error("Migration failed:", error);
    return { updated: 0, errors: 1 };
  }
}
