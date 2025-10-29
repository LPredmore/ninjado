/**
 * Auto-retry utilities with exponential backoff
 */

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

export const withRetry = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    onRetry,
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        throw lastError;
      }

      // Check if error is retryable (network errors)
      const isRetryable = isNetworkError(error);
      if (!isRetryable) {
        throw lastError;
      }

      const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
      onRetry?.(attempt + 1, lastError);

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
};

const isNetworkError = (error: unknown): boolean => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("network") ||
      message.includes("fetch") ||
      message.includes("timeout") ||
      message.includes("connection")
    );
  }
  return false;
};

export const getErrorType = (error: unknown): "network" | "validation" | "unknown" => {
  if (isNetworkError(error)) return "network";
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (
      message.includes("invalid") ||
      message.includes("required") ||
      message.includes("validation")
    ) {
      return "validation";
    }
  }
  
  return "unknown";
};
