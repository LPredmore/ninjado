import { initializePerformanceMonitoring, logPerformanceSummary } from './performanceCollector';
import { performanceMonitor } from './performanceMonitor';

/**
 * Initialize performance monitoring for the application
 * This should be called early in the app lifecycle
 */
export function initializeAppPerformanceMonitoring(): () => void {
  console.log('🚀 Initializing performance monitoring...');
  
  // Start performance monitoring
  const cleanup = initializePerformanceMonitoring();
  
  // Log initial performance summary after a short delay
  setTimeout(() => {
    logPerformanceSummary();
  }, 2000);
  
  // Set up performance logging in development
  if (process.env.NODE_ENV === 'development') {
    // Log performance summary every 60 seconds in development
    const devInterval = setInterval(() => {
      logPerformanceSummary();
    }, 60000);
    
    // Add to cleanup
    const originalCleanup = cleanup;
    const enhancedCleanup = () => {
      clearInterval(devInterval);
      originalCleanup();
    };
    return enhancedCleanup;
  }
  
  return cleanup;
}

/**
 * Performance monitoring utilities for development
 */
export const devPerformanceUtils = {
  /**
   * Log current performance metrics
   */
  logMetrics: () => {
    console.log('Current Performance Metrics:', performanceMonitor.getMetrics());
  },
  
  /**
   * Log performance bottlenecks
   */
  logBottlenecks: () => {
    const bottlenecks = performanceMonitor.reportBottlenecks();
    if (bottlenecks.length > 0) {
      console.warn('Performance Bottlenecks:', bottlenecks);
    } else {
      console.log('No performance bottlenecks detected');
    }
  },
  
  /**
   * Export all performance data
   */
  exportData: () => {
    const data = performanceMonitor.exportData();
    console.log('Performance Data Export:', data);
    return data;
  },
  
  /**
   * Reset all performance data
   */
  reset: () => {
    performanceMonitor.reset();
    console.log('Performance monitoring data reset');
  }
};

// Make dev utils available globally in development
if (process.env.NODE_ENV === 'development') {
  (window as any).performanceUtils = devPerformanceUtils;
  console.log('Performance utilities available at window.performanceUtils');
}