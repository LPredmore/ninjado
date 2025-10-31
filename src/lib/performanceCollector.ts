import { performanceMonitor, PerformanceMetrics } from './performanceMonitor';
import { storageManager } from './storageManager';

/**
 * Performance metrics collector for gathering baseline measurements
 * and tracking performance over time
 */

export interface PerformanceBaseline {
  timestamp: number;
  metrics: PerformanceMetrics;
  userAgent: string;
  url: string;
  sessionId: string;
}

export interface PerformanceReport {
  baseline: PerformanceBaseline;
  current: PerformanceMetrics;
  improvements: {
    renderTime: number;
    memoryUsage: number;
    cacheHitRate: number;
  };
  regressions: string[];
}

class PerformanceCollectorClass {
  private baseline: PerformanceBaseline | null = null;
  private sessionId: string;
  private metricsHistory: PerformanceMetrics[] = [];
  private readonly STORAGE_KEY = 'performance-baseline';
  private readonly MAX_HISTORY = 50;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.loadBaseline();
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Load baseline from storage
   */
  private loadBaseline(): void {
    try {
      this.baseline = storageManager.get<PerformanceBaseline>(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to load performance baseline:', error);
    }
  }

  /**
   * Save baseline to storage
   */
  private saveBaseline(): void {
    if (this.baseline) {
      try {
        storageManager.set(this.STORAGE_KEY, this.baseline);
      } catch (error) {
        console.warn('Failed to save performance baseline:', error);
      }
    }
  }

  /**
   * Collect current performance metrics and set as baseline
   */
  collectBaseline(): PerformanceBaseline {
    const metrics = performanceMonitor.getMetrics();
    
    this.baseline = {
      timestamp: Date.now(),
      metrics,
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: this.sessionId,
    };

    this.saveBaseline();
    return this.baseline;
  }

  /**
   * Collect current performance metrics
   */
  collectMetrics(): PerformanceMetrics {
    const metrics = performanceMonitor.getMetrics();
    
    // Add to history
    this.metricsHistory.push(metrics);
    
    // Keep only recent metrics
    if (this.metricsHistory.length > this.MAX_HISTORY) {
      this.metricsHistory = this.metricsHistory.slice(-this.MAX_HISTORY);
    }
    
    return metrics;
  }

  /**
   * Get performance report comparing current metrics to baseline
   */
  getPerformanceReport(): PerformanceReport | null {
    if (!this.baseline) {
      return null;
    }

    const current = this.collectMetrics();
    const baselineMetrics = this.baseline.metrics;

    const improvements = {
      renderTime: baselineMetrics.renderTime - current.renderTime,
      memoryUsage: baselineMetrics.memoryUsage - current.memoryUsage,
      cacheHitRate: current.cacheHitRate - baselineMetrics.cacheHitRate,
    };

    const regressions: string[] = [];
    
    if (improvements.renderTime < -5) { // 5ms regression threshold
      regressions.push(`Render time increased by ${Math.abs(improvements.renderTime).toFixed(2)}ms`);
    }
    
    if (improvements.memoryUsage < -5 * 1024 * 1024) { // 5MB regression threshold
      const regressionMB = Math.abs(improvements.memoryUsage) / 1024 / 1024;
      regressions.push(`Memory usage increased by ${regressionMB.toFixed(1)}MB`);
    }
    
    if (improvements.cacheHitRate < -10) { // 10% regression threshold
      regressions.push(`Cache hit rate decreased by ${Math.abs(improvements.cacheHitRate).toFixed(1)}%`);
    }

    return {
      baseline: this.baseline,
      current,
      improvements,
      regressions,
    };
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(): PerformanceMetrics[] {
    return [...this.metricsHistory];
  }

  /**
   * Get average metrics from history
   */
  getAverageMetrics(): PerformanceMetrics | null {
    if (this.metricsHistory.length === 0) {
      return null;
    }

    const totals = this.metricsHistory.reduce(
      (acc, metrics) => ({
        renderTime: acc.renderTime + metrics.renderTime,
        componentCount: acc.componentCount + metrics.componentCount,
        memoryUsage: acc.memoryUsage + metrics.memoryUsage,
        cacheHitRate: acc.cacheHitRate + metrics.cacheHitRate,
        storageOperations: acc.storageOperations + metrics.storageOperations,
        timestamp: acc.timestamp,
      }),
      {
        renderTime: 0,
        componentCount: 0,
        memoryUsage: 0,
        cacheHitRate: 0,
        storageOperations: 0,
        timestamp: Date.now(),
      }
    );

    const count = this.metricsHistory.length;
    
    return {
      renderTime: totals.renderTime / count,
      componentCount: totals.componentCount / count,
      memoryUsage: totals.memoryUsage / count,
      cacheHitRate: totals.cacheHitRate / count,
      storageOperations: totals.storageOperations / count,
      timestamp: Date.now(),
    };
  }

  /**
   * Reset baseline and history
   */
  reset(): void {
    this.baseline = null;
    this.metricsHistory = [];
    try {
      storageManager.remove(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to remove performance baseline:', error);
    }
  }

  /**
   * Export all performance data
   */
  exportData(): {
    baseline: PerformanceBaseline | null;
    history: PerformanceMetrics[];
    average: PerformanceMetrics | null;
    report: PerformanceReport | null;
    monitorData: ReturnType<typeof performanceMonitor.exportData>;
  } {
    return {
      baseline: this.baseline,
      history: this.getMetricsHistory(),
      average: this.getAverageMetrics(),
      report: this.getPerformanceReport(),
      monitorData: performanceMonitor.exportData(),
    };
  }

  /**
   * Check if performance is within acceptable thresholds
   */
  isPerformanceAcceptable(): {
    acceptable: boolean;
    issues: string[];
  } {
    const current = performanceMonitor.getMetrics();
    const issues: string[] = [];

    // Check render time (should be < 16ms for 60fps)
    if (current.renderTime > 16) {
      issues.push(`Render time too high: ${current.renderTime.toFixed(2)}ms`);
    }

    // Check memory usage (should be < 50MB)
    if (current.memoryUsage > 50 * 1024 * 1024) {
      const memoryMB = current.memoryUsage / 1024 / 1024;
      issues.push(`Memory usage too high: ${memoryMB.toFixed(1)}MB`);
    }

    // Check cache hit rate (should be > 80%)
    if (current.cacheHitRate < 80 && current.cacheHitRate > 0) {
      issues.push(`Cache hit rate too low: ${current.cacheHitRate.toFixed(1)}%`);
    }

    return {
      acceptable: issues.length === 0,
      issues,
    };
  }
}

// Create singleton instance
export const performanceCollector = new PerformanceCollectorClass();

/**
 * Initialize performance monitoring for the app
 */
export function initializePerformanceMonitoring(): () => void {
  // Collect initial baseline if none exists
  if (!performanceCollector.getPerformanceReport()) {
    console.log('Collecting initial performance baseline...');
    performanceCollector.collectBaseline();
  }

  // Set up periodic metrics collection
  const collectMetrics = () => {
    performanceCollector.collectMetrics();
    
    // Check performance and log issues
    const { acceptable, issues } = performanceCollector.isPerformanceAcceptable();
    if (!acceptable) {
      console.warn('Performance issues detected:', issues);
    }
  };

  // Collect metrics every 30 seconds
  const intervalId = setInterval(collectMetrics, 30000);

  // Collect metrics on page visibility change
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      collectMetrics();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Cleanup function
  const cleanup = () => {
    clearInterval(intervalId);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
  
  return cleanup;
}

/**
 * Log performance summary to console
 */
export function logPerformanceSummary(): void {
  const report = performanceCollector.getPerformanceReport();
  const average = performanceCollector.getAverageMetrics();
  
  console.group('Performance Summary');
  
  if (report) {
    console.log('Baseline vs Current:');
    console.table({
      'Render Time (ms)': {
        baseline: report.baseline.metrics.renderTime.toFixed(2),
        current: report.current.renderTime.toFixed(2),
        improvement: report.improvements.renderTime.toFixed(2),
      },
      'Memory Usage (MB)': {
        baseline: (report.baseline.metrics.memoryUsage / 1024 / 1024).toFixed(1),
        current: (report.current.memoryUsage / 1024 / 1024).toFixed(1),
        improvement: (report.improvements.memoryUsage / 1024 / 1024).toFixed(1),
      },
      'Cache Hit Rate (%)': {
        baseline: report.baseline.metrics.cacheHitRate.toFixed(1),
        current: report.current.cacheHitRate.toFixed(1),
        improvement: report.improvements.cacheHitRate.toFixed(1),
      },
    });
    
    if (report.regressions.length > 0) {
      console.warn('Performance Regressions:', report.regressions);
    }
  }
  
  if (average) {
    console.log('Average Metrics:', average);
  }
  
  const bottlenecks = performanceMonitor.reportBottlenecks();
  if (bottlenecks.length > 0) {
    console.warn('Performance Bottlenecks:', bottlenecks);
  }
  
  console.groupEnd();
}