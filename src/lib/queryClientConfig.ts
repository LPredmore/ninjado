import { QueryClient, DefaultOptions } from "@tanstack/react-query";

/**
 * Default query options optimized for the ninja productivity app
 */
const defaultQueryOptions: DefaultOptions = {
  queries: {
    // Global defaults - can be overridden by specific query configs
    staleTime: 2 * 60 * 1000, // 2 minutes default
    cacheTime: 5 * 60 * 1000, // 5 minutes default
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (client errors)
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as any).status;
        if (status >= 400 && status < 500) {
          return false;
        }
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  },
  mutations: {
    retry: 1,
    retryDelay: 1000,
  },
};

/**
 * Create an optimized QueryClient instance
 */
export const createOptimizedQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: defaultQueryOptions,
  });
};

/**
 * Singleton instance for the app
 */
let queryClientInstance: QueryClient | null = null;

/**
 * Get the singleton QueryClient instance
 */
export const getQueryClient = (): QueryClient => {
  if (!queryClientInstance) {
    queryClientInstance = createOptimizedQueryClient();
  }
  return queryClientInstance;
};