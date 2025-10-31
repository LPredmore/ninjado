import { QueryClient } from "@tanstack/react-query";
import { SupabaseClient } from "@supabase/supabase-js";
import { queryKeys, queryConfigs } from "./queryConfig";

/**
 * Utility class for managing query prefetching
 */
export class QueryPrefetchManager {
  constructor(
    private queryClient: QueryClient,
    private supabase: SupabaseClient
  ) {}

  /**
   * Prefetch user routines when user logs in
   */
  async prefetchUserRoutines(userId: string) {
    await this.queryClient.prefetchQuery({
      queryKey: queryKeys.routines(userId),
      queryFn: async () => {
        const { data, error } = await this.supabase
          .from("routines")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data;
      },
      ...queryConfigs.routines,
    });
  }

  /**
   * Prefetch user profile when user logs in
   */
  async prefetchUserProfile(userId: string) {
    await this.queryClient.prefetchQuery({
      queryKey: queryKeys.profile(userId),
      queryFn: async () => {
        const { data, error } = await this.supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        if (error) throw error;
        return data;
      },
      ...queryConfigs.profile,
    });
  }

  /**
   * Prefetch tasks for a specific routine
   */
  async prefetchRoutineTasks(routineId: string) {
    await this.queryClient.prefetchQuery({
      queryKey: queryKeys.tasks(routineId),
      queryFn: async () => {
        const { data, error } = await this.supabase
          .from("routine_tasks")
          .select("*")
          .eq("routine_id", routineId)
          .order("position", { ascending: true });

        if (error) throw error;
        return data;
      },
      ...queryConfigs.tasks,
    });
  }

  /**
   * Prefetch all tasks for user's routines
   */
  async prefetchAllUserTasks(userId: string) {
    await this.queryClient.prefetchQuery({
      queryKey: queryKeys.allRoutineTasks(userId),
      queryFn: async () => {
        const { data, error } = await this.supabase
          .from("routine_tasks")
          .select("*, routines!inner(user_id)")
          .eq("routines.user_id", userId)
          .order("position", { ascending: true });

        if (error) throw error;
        return data;
      },
      ...queryConfigs.tasks,
    });
  }

  /**
   * Prefetch efficiency stats for user
   */
  async prefetchEfficiencyStats(userId: string) {
    await this.queryClient.prefetchQuery({
      queryKey: queryKeys.efficiencyStats(userId),
      queryFn: async () => {
        // This would be implemented based on your efficiency calculation logic
        // For now, return empty array as placeholder
        return [];
      },
      ...queryConfigs.efficiencyStats,
    });
  }

  /**
   * Prefetch rewards data
   */
  async prefetchRewards() {
    await this.queryClient.prefetchQuery({
      queryKey: queryKeys.rewards(),
      queryFn: async () => {
        const { data, error } = await this.supabase
          .from("rewards")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data;
      },
      ...queryConfigs.rewards,
    });
  }

  /**
   * Batch prefetch common user data on login
   */
  async prefetchUserData(userId: string) {
    await Promise.allSettled([
      this.prefetchUserProfile(userId),
      this.prefetchUserRoutines(userId),
      this.prefetchAllUserTasks(userId),
      this.prefetchEfficiencyStats(userId),
      this.prefetchRewards(),
    ]);
  }

  /**
   * Prefetch data for routine execution
   */
  async prefetchRoutineExecution(routineId: string, userId: string) {
    await Promise.allSettled([
      this.prefetchRoutineTasks(routineId),
      this.prefetchEfficiencyStats(userId),
    ]);
  }
}

/**
 * Create a prefetch manager instance
 */
export const createQueryPrefetchManager = (
  queryClient: QueryClient,
  supabase: SupabaseClient
) => {
  return new QueryPrefetchManager(queryClient, supabase);
};