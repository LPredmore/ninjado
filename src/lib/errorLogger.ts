/**
 * Centralized error logging utility
 * Replaces console.error with structured logging
 */

interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  [key: string]: any;
}

export const logError = (
  message: string,
  error: unknown,
  context?: ErrorContext
) => {
  const errorDetails = {
    message,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
    ...context,
  };

  // In development, log to console
  if (import.meta.env.DEV) {
    console.error('[Error Log]', errorDetails);
  }

  // In production, you could send to error tracking service
  // e.g., Sentry.captureException(error, { extra: errorDetails });
  
  return errorDetails;
};
