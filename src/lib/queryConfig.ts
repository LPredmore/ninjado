import { QueryClient } from "@tanstack/react-query";

/**
 * Optimized query configurations for different data types
 * Based on data freshness requirements and usage patterns
 */
export const queryConfigs = {
  // Routines change infrequently, can be cached longer
  routines: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  },
  // Tasks change more frequently during routine execution
  tasks: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  },
  // Efficiency stats should be relatively fresh for accurate feedback
  efficiencyStats: {
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    retry: 1,
  },
  // Task performance data for reports
  taskPerformance: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  },
  // User profile data changes infrequently
  profile: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  },
  // Rewards data
  rewards: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  },
} as const;

/**
 * Optimized query key factory with proper hierarchical structure
 * Follows the pattern: [domain, entity, ...identifiers]
 */
export const queryKeys = {
  // Root key for the entire app
  all: ['ninjado'] as const,
  
  // User-related queries
  users: () => [...queryKeys.all, 'users'] as const,
  user: (userId: string) => [...queryKeys.users(), userId] as const,
  profile: (userId: string) => [...queryKeys.user(userId), 'profile'] as const,
  
  // Routine-related queries
  routines: (userId: string) => [...queryKeys.user(userId), 'routines'] as const,
  routine: (routineId: string) => [...queryKeys.all, 'routine', routineId] as const,
  
  // Task-related queries
  tasks: (routineId: string | null) => [...queryKeys.all, 'tasks', routineId] as const,
  allRoutineTasks: (userId: string) => [...queryKeys.user(userId), 'tasks'] as const,
  
  // Performance and efficiency queries
  efficiency: (userId: string) => [...queryKeys.user(userId), 'efficiency'] as const,
  efficiencyStats: (userId: string) => [...queryKeys.efficiency(userId), 'stats'] as const,
  taskPerformance: (userId: string) => [...queryKeys.user(userId), 'performance'] as const,
  
  // Rewards queries
  rewards: () => [...queryKeys.all, 'rewards'] as const,
} as const;

/**
 * Selective invalidation utilities for efficient cache management
 */
export class QueryInvalidationManager {
  constructor(private queryClient: QueryClient) {}

  /**
   * Invalidate all routine-related queries for a user
   */
  invalidateRoutineQueries(userId: string) {
    this.queryClient.invalidateQueries({ queryKey: queryKeys.routines(userId) });
    this.queryClient.invalidateQueries({ queryKey: queryKeys.allRoutineTasks(userId) });
  }

  /**
   * Invalidate specific routine data
   */
  invalidateRoutine(routineId: string) {
    this.queryClient.invalidateQueries({ queryKey: queryKeys.routine(routineId) });
  }

  /**
   * Invalidate task-related queries
   */
  invalidateTaskQueries(routineId: string | null, userId?: string) {
    this.queryClient.invalidateQueries({ queryKey: queryKeys.tasks(routineId) });
    if (userId) {
      this.queryClient.invalidateQueries({ queryKey: queryKeys.allRoutineTasks(userId) });
    }
  }

  /**
   * Invalidate efficiency and performance data
   */
  invalidateEfficiencyQueries(userId: string) {
    this.queryClient.invalidateQueries({ queryKey: queryKeys.efficiency(userId) });
    this.queryClient.invalidateQueries({ queryKey: queryKeys.taskPerformance(userId) });
  }

  /**
   * Invalidate user profile data
   */
  invalidateProfile(userId: string) {
    this.queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId) });
  }

  /**
   * Invalidate rewards data
   */
  invalidateRewards() {
    this.queryClient.invalidateQueries({ queryKey: queryKeys.rewards() });
  }

  /**
   * Selective invalidation based on data type and scope
   */
  invalidateByScope(scope: 'user' | 'routine' | 'task' | 'efficiency' | 'rewards', identifier?: string) {
    switch (scope) {
      case 'user':
        if (identifier) {
          this.queryClient.invalidateQueries({ queryKey: queryKeys.user(identifier) });
        }
        break;
      case 'routine':
        if (identifier) {
          this.invalidateRoutine(identifier);
        }
        break;
      case 'task':
        if (identifier) {
          this.invalidateTaskQueries(identifier);
        }
        break;
      case 'efficiency':
        if (identifier) {
          this.invalidateEfficiencyQueries(identifier);
        }
        break;
      case 'rewards':
        this.invalidateRewards();
        break;
    }
  }

  /**
   * Batch invalidation for multiple related queries
   */
  batchInvalidate(operations: Array<{ scope: string; identifier?: string }>) {
    operations.forEach(({ scope, identifier }) => {
      this.invalidateByScope(scope as any, identifier);
    });
  }
}

/**
 * Utility function to create a query invalidation manager instance
 */
export const createQueryInvalidationManager = (queryClient: QueryClient) => {
  return new QueryInvalidationManager(queryClient);
};

/**
 * Legacy compatibility - maintains existing invalidateRoutineQueries function
 * @deprecated Use QueryInvalidationManager.invalidateRoutineQueries instead
 */
export const invalidateRoutineQueries = (queryClient: QueryClient, userId: string) => {
  const manager = createQueryInvalidationManager(queryClient);
  manager.invalidateRoutineQueries(userId);
};