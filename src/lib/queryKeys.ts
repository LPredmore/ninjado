import { QueryClient } from "@tanstack/react-query";

/**
 * @deprecated Use queryKeys from queryConfig.ts instead
 * Maintained for backward compatibility during migration
 */
export const queryKeys = {
  routines: (userId: string) => ["routines", userId] as const,
  tasks: (routineId: string | null) => ["tasks", routineId] as const,
  allRoutineTasks: (userId: string) => ["routines", "tasks", userId] as const,
};

/**
 * @deprecated Use QueryInvalidationManager from queryConfig.ts instead
 * Utility to invalidate all routine-related queries for a user
 * This ensures cache consistency across all components
 */
export const invalidateRoutineQueries = (queryClient: QueryClient, userId: string) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.routines(userId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.allRoutineTasks(userId) });
};
