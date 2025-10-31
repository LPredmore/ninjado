import { initializePerformanceMonitoring } from './performanceCollector';
import { initializeRegressionDetection } from './performanceRegressionDetector';
import { performanceFlowTracker, CRITICAL_FLOWS, FLOW_STEPS } from './performanceFlowTracker';
import { performanceMonitor } from './performanceMonitor';
import { performanceValidation, runOptimizationValidation } from './performanceValidation';
import { bundleAnalyzer } from './bundleAnalyzer';
import { initializeMemoryLeakDetection } from './memoryLeakDetector';

/**
 * Comprehensive performance monitoring integration
 * Sets up all performance monitoring systems and provides unified interface
 */

let isInitialized = false;
let cleanupFunctions: Array<() => void> = [];

/**
 * Initialize all performance monitoring systems
 */
export function initializePerformanceIntegration(): () => void {
  if (isInitialized) {
    console.warn('Performance monitoring already initialized');
    return () => {};
  }

  console.log('🚀 Initializing performance monitoring integration...');

  // Initialize performance monitoring
  const cleanupMonitoring = initializePerformanceMonitoring();
  cleanupFunctions.push(cleanupMonitoring);

  // Initialize regression detection
  const cleanupRegression = initializeRegressionDetection();
  cleanupFunctions.push(cleanupRegression);

  // Initialize memory leak detection
  const cleanupMemoryDetection = initializeMemoryLeakDetection();
  cleanupFunctions.push(cleanupMemoryDetection);

  // Run initial bundle analysis
  setTimeout(() => {
    bundleAnalyzer.analyzeBundles();
  }, 2000);

  // Run optimization validation after initial load
  setTimeout(() => {
    runOptimizationValidation();
  }, 5000);

  // Track app startup flow
  const appStartupFlowId = performanceFlowTracker.startFlow(CRITICAL_FLOWS.APP_STARTUP, {
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
  });

  performanceFlowTracker.addFlowStep(appStartupFlowId, FLOW_STEPS.APP_INIT);

  // Complete app startup flow after a short delay to capture initial render
  setTimeout(() => {
    performanceFlowTracker.addFlowStep(appStartupFlowId, FLOW_STEPS.UI_RENDER);
    performanceFlowTracker.completeFlow(appStartupFlowId, {
      success: true,
      initialLoadComplete: true,
    });
  }, 1000);

  // Set up navigation tracking
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function(...args) {
    const flowId = performanceFlowTracker.startFlow(CRITICAL_FLOWS.NAVIGATION, {
      from: window.location.pathname,
      to: args[2] || 'unknown',
    });
    
    performanceFlowTracker.addFlowStep(flowId, FLOW_STEPS.PAGE_LOAD);
    
    // Complete navigation flow after a short delay
    setTimeout(() => {
      performanceFlowTracker.completeFlow(flowId);
    }, 500);
    
    return originalPushState.apply(this, args);
  };

  history.replaceState = function(...args) {
    const flowId = performanceFlowTracker.startFlow(CRITICAL_FLOWS.NAVIGATION, {
      from: window.location.pathname,
      to: args[2] || 'unknown',
    });
    
    performanceFlowTracker.addFlowStep(flowId, FLOW_STEPS.PAGE_LOAD);
    
    // Complete navigation flow after a short delay
    setTimeout(() => {
      performanceFlowTracker.completeFlow(flowId);
    }, 500);
    
    return originalReplaceState.apply(this, args);
  };

  // Restore original functions on cleanup
  cleanupFunctions.push(() => {
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;
  });

  // Track performance on page visibility changes
  const handleVisibilityChange = () => {
    if (document.hidden) {
      performanceMonitor.startMeasurement('page-hidden-duration');
    } else {
      const hiddenDuration = performanceMonitor.endMeasurement('page-hidden-duration');
      if (hiddenDuration > 0) {
        console.log(`📱 Page was hidden for ${hiddenDuration.toFixed(2)}ms`);
      }
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  cleanupFunctions.push(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  });

  // Track unhandled errors as performance issues
  const handleError = (event: ErrorEvent) => {
    console.error('🚨 Unhandled error detected:', event.error);
    
    // You could track errors as failed flows here
    // performanceFlowTracker.failFlow(someFlowId, event.message);
  };

  window.addEventListener('error', handleError);
  cleanupFunctions.push(() => {
    window.removeEventListener('error', handleError);
  });

  // Track unhandled promise rejections
  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    console.error('🚨 Unhandled promise rejection:', event.reason);
  };

  window.addEventListener('unhandledrejection', handleUnhandledRejection);
  cleanupFunctions.push(() => {
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  });

  isInitialized = true;
  console.log('✅ Performance monitoring integration initialized');

  // Return cleanup function
  return () => {
    console.log('🧹 Cleaning up performance monitoring...');
    cleanupFunctions.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        console.error('Error during performance monitoring cleanup:', error);
      }
    });
    cleanupFunctions = [];
    isInitialized = false;
  };
}

/**
 * Get comprehensive performance summary for logging
 */
export function getPerformanceSummary(): {
  metrics: ReturnType<typeof performanceMonitor.getMetrics>;
  flows: ReturnType<typeof performanceFlowTracker.getAllFlowMetrics>;
  bottlenecks: string[];
  validation: ReturnType<typeof performanceValidation.getLatestValidation>;
  bundleAnalysis: ReturnType<typeof bundleAnalyzer.analyzeBundles>;
} {
  return {
    metrics: performanceMonitor.getMetrics(),
    flows: performanceFlowTracker.getAllFlowMetrics(),
    bottlenecks: performanceMonitor.reportBottlenecks(),
    validation: performanceValidation.getLatestValidation(),
    bundleAnalysis: bundleAnalyzer.analyzeBundles(),
  };
}

/**
 * Log comprehensive performance summary to console
 */
export function logPerformanceSummary(): void {
  const summary = getPerformanceSummary();
  
  console.group('🎯 Comprehensive Performance Summary');
  
  console.log('📊 Current Metrics:', summary.metrics);
  console.log('🔄 Flow Metrics:', summary.flows);
  console.log('📦 Bundle Analysis:', summary.bundleAnalysis);
  
  if (summary.validation) {
    console.log('✅ Optimization Validation:', {
      success: summary.validation.overallSuccess,
      achieved: `${summary.validation.achievedTargets}/${summary.validation.totalTargets}`,
      summary: summary.validation.summary,
    });
  }
  
  if (summary.bottlenecks.length > 0) {
    console.warn('⚠️ Performance Bottlenecks:', summary.bottlenecks);
  } else {
    console.log('✅ No performance bottlenecks detected');
  }
  
  console.groupEnd();
}

/**
 * Run comprehensive performance validation
 */
export function validatePerformanceOptimizations(): ReturnType<typeof runOptimizationValidation> {
  console.log('🚀 Running comprehensive performance validation...');
  
  const validationReport = runOptimizationValidation();
  const bundleAnalysis = bundleAnalyzer.analyzeBundles();
  
  console.group('📋 Performance Validation Results');
  console.log('Optimization Validation:', validationReport);
  console.log('Bundle Analysis:', bundleAnalysis);
  console.groupEnd();
  
  return validationReport;
}

/**
 * Check if performance monitoring is initialized
 */
export function isPerformanceMonitoringInitialized(): boolean {
  return isInitialized;
}

/**
 * Export critical flows and steps for use in components
 */
export { CRITICAL_FLOWS, FLOW_STEPS } from './performanceFlowTracker';