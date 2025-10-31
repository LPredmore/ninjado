import { performanceCollector, PerformanceBaseline, PerformanceReport } from './performanceCollector';
import { performanceMonitor, PerformanceMetrics } from './performanceMonitor';
import { performanceFlowTracker, FlowMetrics } from './performanceFlowTracker';
import { storageManager } from './storageManager';

/**
 * Automated performance regression detection system
 * Monitors performance metrics and alerts when regressions are detected
 */

export interface RegressionThreshold {
  metric: string;
  threshold: number;
  unit: string;
  isPercentage?: boolean;
}

export interface RegressionAlert {
  id: string;
  timestamp: number;
  metric: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  currentValue: number;
  baselineValue: number;
  regression: number;
  description: string;
  suggestions: string[];
}

export interface RegressionReport {
  timestamp: number;
  alerts: RegressionAlert[];
  summary: {
    totalAlerts: number;
    criticalAlerts: number;
    highAlerts: number;
    mediumAlerts: number;
    lowAlerts: number;
  };
  overallStatus: 'good' | 'warning' | 'critical';
}

class PerformanceRegressionDetectorClass {
  private readonly STORAGE_KEY = 'performance-regression-history';
  private readonly MAX_HISTORY = 50;
  
  // Default regression thresholds
  private readonly DEFAULT_THRESHOLDS: RegressionThreshold[] = [
    { metric: 'renderTime', threshold: 5, unit: 'ms' },
    { metric: 'memoryUsage', threshold: 10, unit: 'MB' },
    { metric: 'cacheHitRate', threshold: 10, unit: '%', isPercentage: true },
    { metric: 'flowDuration', threshold: 20, unit: '%', isPercentage: true },
    { metric: 'completionRate', threshold: 5, unit: '%', isPercentage: true },
  ];

  private regressionHistory: RegressionReport[] = [];
  private alertCallbacks: Array<(alert: RegressionAlert) => void> = [];

  constructor() {
    this.loadHistory();
  }

  /**
   * Load regression history from storage
   */
  private loadHistory(): void {
    try {
      const history = storageManager.get<RegressionReport[]>(this.STORAGE_KEY, []);
      this.regressionHistory = history;
    } catch (error) {
      console.warn('Failed to load regression history:', error);
      this.regressionHistory = [];
    }
  }

  /**
   * Save regression history to storage
   */
  private saveHistory(): void {
    try {
      storageManager.set(this.STORAGE_KEY, this.regressionHistory);
    } catch (error) {
      console.warn('Failed to save regression history:', error);
    }
  }

  /**
   * Register callback for regression alerts
   */
  onRegressionAlert(callback: (alert: RegressionAlert) => void): () => void {
    this.alertCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.alertCallbacks.indexOf(callback);
      if (index > -1) {
        this.alertCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Trigger alert callbacks
   */
  private triggerAlert(alert: RegressionAlert): void {
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error in regression alert callback:', error);
      }
    });
  }

  /**
   * Check for performance regressions
   */
  checkForRegressions(customThresholds?: RegressionThreshold[]): RegressionReport {
    const thresholds = customThresholds || this.DEFAULT_THRESHOLDS;
    const alerts: RegressionAlert[] = [];
    const timestamp = Date.now();

    // Check performance metrics regressions
    const performanceReport = performanceCollector.getPerformanceReport();
    if (performanceReport) {
      alerts.push(...this.checkPerformanceMetricsRegressions(performanceReport, thresholds));
    }

    // Check flow metrics regressions
    const flowMetrics = performanceFlowTracker.getAllFlowMetrics();
    alerts.push(...this.checkFlowMetricsRegressions(flowMetrics, thresholds));

    // Create regression report
    const report: RegressionReport = {
      timestamp,
      alerts,
      summary: this.createSummary(alerts),
      overallStatus: this.determineOverallStatus(alerts),
    };

    // Save to history
    this.regressionHistory.push(report);
    if (this.regressionHistory.length > this.MAX_HISTORY) {
      this.regressionHistory = this.regressionHistory.slice(-this.MAX_HISTORY);
    }
    this.saveHistory();

    // Trigger alerts
    alerts.forEach(alert => this.triggerAlert(alert));

    return report;
  }

  /**
   * Check performance metrics for regressions
   */
  private checkPerformanceMetricsRegressions(
    report: PerformanceReport,
    thresholds: RegressionThreshold[]
  ): RegressionAlert[] {
    const alerts: RegressionAlert[] = [];
    const { baseline, current, improvements } = report;

    // Check render time regression
    const renderThreshold = thresholds.find(t => t.metric === 'renderTime');
    if (renderThreshold && improvements.renderTime < -renderThreshold.threshold) {
      alerts.push({
        id: `render-time-${Date.now()}`,
        timestamp: Date.now(),
        metric: 'renderTime',
        severity: this.getSeverity(Math.abs(improvements.renderTime), renderThreshold.threshold),
        currentValue: current.renderTime,
        baselineValue: baseline.metrics.renderTime,
        regression: Math.abs(improvements.renderTime),
        description: `Render time increased by ${Math.abs(improvements.renderTime).toFixed(2)}ms`,
        suggestions: [
          'Check for unnecessary re-renders',
          'Review component memoization',
          'Optimize expensive calculations',
        ],
      });
    }

    // Check memory usage regression
    const memoryThreshold = thresholds.find(t => t.metric === 'memoryUsage');
    if (memoryThreshold) {
      const memoryRegressionMB = Math.abs(improvements.memoryUsage) / 1024 / 1024;
      if (improvements.memoryUsage < -(memoryThreshold.threshold * 1024 * 1024)) {
        alerts.push({
          id: `memory-usage-${Date.now()}`,
          timestamp: Date.now(),
          metric: 'memoryUsage',
          severity: this.getSeverity(memoryRegressionMB, memoryThreshold.threshold),
          currentValue: current.memoryUsage / 1024 / 1024,
          baselineValue: baseline.metrics.memoryUsage / 1024 / 1024,
          regression: memoryRegressionMB,
          description: `Memory usage increased by ${memoryRegressionMB.toFixed(1)}MB`,
          suggestions: [
            'Check for memory leaks',
            'Review component cleanup',
            'Optimize data structures',
          ],
        });
      }
    }

    // Check cache hit rate regression
    const cacheThreshold = thresholds.find(t => t.metric === 'cacheHitRate');
    if (cacheThreshold && improvements.cacheHitRate < -cacheThreshold.threshold) {
      alerts.push({
        id: `cache-hit-rate-${Date.now()}`,
        timestamp: Date.now(),
        metric: 'cacheHitRate',
        severity: this.getSeverity(Math.abs(improvements.cacheHitRate), cacheThreshold.threshold),
        currentValue: current.cacheHitRate,
        baselineValue: baseline.metrics.cacheHitRate,
        regression: Math.abs(improvements.cacheHitRate),
        description: `Cache hit rate decreased by ${Math.abs(improvements.cacheHitRate).toFixed(1)}%`,
        suggestions: [
          'Review query configurations',
          'Check cache invalidation patterns',
          'Optimize query key structures',
        ],
      });
    }

    return alerts;
  }

  /**
   * Check flow metrics for regressions
   */
  private checkFlowMetricsRegressions(
    flowMetrics: FlowMetrics[],
    thresholds: RegressionThreshold[]
  ): RegressionAlert[] {
    const alerts: RegressionAlert[] = [];
    const flowThreshold = thresholds.find(t => t.metric === 'flowDuration');
    const completionThreshold = thresholds.find(t => t.metric === 'completionRate');

    // Get historical flow metrics for comparison
    const historicalMetrics = this.getHistoricalFlowMetrics();

    flowMetrics.forEach(metric => {
      const historical = historicalMetrics.get(metric.flowName);
      
      if (historical && flowThreshold) {
        // Check flow duration regression
        const durationIncrease = ((metric.averageDuration - historical.averageDuration) / historical.averageDuration) * 100;
        if (durationIncrease > flowThreshold.threshold) {
          alerts.push({
            id: `flow-duration-${metric.flowName}-${Date.now()}`,
            timestamp: Date.now(),
            metric: 'flowDuration',
            severity: this.getSeverity(durationIncrease, flowThreshold.threshold),
            currentValue: metric.averageDuration,
            baselineValue: historical.averageDuration,
            regression: durationIncrease,
            description: `Flow "${metric.flowName}" duration increased by ${durationIncrease.toFixed(1)}%`,
            suggestions: [
              'Profile flow steps for bottlenecks',
              'Optimize slow operations',
              'Check for blocking operations',
            ],
          });
        }
      }

      if (historical && completionThreshold) {
        // Check completion rate regression
        const completionDecrease = historical.completionRate - metric.completionRate;
        if (completionDecrease > completionThreshold.threshold) {
          alerts.push({
            id: `completion-rate-${metric.flowName}-${Date.now()}`,
            timestamp: Date.now(),
            metric: 'completionRate',
            severity: this.getSeverity(completionDecrease, completionThreshold.threshold),
            currentValue: metric.completionRate,
            baselineValue: historical.completionRate,
            regression: completionDecrease,
            description: `Flow "${metric.flowName}" completion rate decreased by ${completionDecrease.toFixed(1)}%`,
            suggestions: [
              'Check for error conditions',
              'Review user experience issues',
              'Analyze failed flows',
            ],
          });
        }
      }
    });

    return alerts;
  }

  /**
   * Get historical flow metrics for comparison
   */
  private getHistoricalFlowMetrics(): Map<string, FlowMetrics> {
    const historicalMetrics = new Map<string, FlowMetrics>();
    
    // Use metrics from previous reports (simplified approach)
    // In a real implementation, you might store flow metrics separately
    if (this.regressionHistory.length > 0) {
      // This is a simplified approach - in practice you'd store flow metrics
      // For now, we'll use empty historical data
    }
    
    return historicalMetrics;
  }

  /**
   * Determine severity based on regression amount
   */
  private getSeverity(regression: number, threshold: number): RegressionAlert['severity'] {
    const ratio = regression / threshold;
    
    if (ratio >= 3) return 'critical';
    if (ratio >= 2) return 'high';
    if (ratio >= 1.5) return 'medium';
    return 'low';
  }

  /**
   * Create summary of alerts
   */
  private createSummary(alerts: RegressionAlert[]): RegressionReport['summary'] {
    return {
      totalAlerts: alerts.length,
      criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
      highAlerts: alerts.filter(a => a.severity === 'high').length,
      mediumAlerts: alerts.filter(a => a.severity === 'medium').length,
      lowAlerts: alerts.filter(a => a.severity === 'low').length,
    };
  }

  /**
   * Determine overall status
   */
  private determineOverallStatus(alerts: RegressionAlert[]): RegressionReport['overallStatus'] {
    if (alerts.some(a => a.severity === 'critical')) return 'critical';
    if (alerts.some(a => a.severity === 'high' || a.severity === 'medium')) return 'warning';
    return 'good';
  }

  /**
   * Get regression history
   */
  getHistory(): RegressionReport[] {
    return [...this.regressionHistory];
  }

  /**
   * Get latest regression report
   */
  getLatestReport(): RegressionReport | null {
    return this.regressionHistory.length > 0
      ? this.regressionHistory[this.regressionHistory.length - 1]
      : null;
  }

  /**
   * Clear regression history
   */
  clearHistory(): void {
    this.regressionHistory = [];
    this.saveHistory();
  }

  /**
   * Get regression trends
   */
  getRegressionTrends(): {
    metric: string;
    trend: 'improving' | 'stable' | 'degrading';
    recentAlerts: number;
  }[] {
    const recentReports = this.regressionHistory.slice(-10); // Last 10 reports
    const metricTrends = new Map<string, number[]>();

    // Collect metric values over time
    recentReports.forEach(report => {
      report.alerts.forEach(alert => {
        const values = metricTrends.get(alert.metric) || [];
        values.push(alert.regression);
        metricTrends.set(alert.metric, values);
      });
    });

    // Analyze trends
    return Array.from(metricTrends.entries()).map(([metric, values]) => {
      const recentAlerts = values.length;
      let trend: 'improving' | 'stable' | 'degrading' = 'stable';

      if (values.length >= 3) {
        const recent = values.slice(-3);
        const isIncreasing = recent.every((val, i) => i === 0 || val >= recent[i - 1]);
        const isDecreasing = recent.every((val, i) => i === 0 || val <= recent[i - 1]);

        if (isIncreasing) trend = 'degrading';
        else if (isDecreasing) trend = 'improving';
      }

      return { metric, trend, recentAlerts };
    });
  }
}

// Create singleton instance
export const performanceRegressionDetector = new PerformanceRegressionDetectorClass();

/**
 * Initialize automated regression detection
 */
export function initializeRegressionDetection(): () => void {
  // Check for regressions every 2 minutes
  const intervalId = setInterval(() => {
    performanceRegressionDetector.checkForRegressions();
  }, 2 * 60 * 1000);

  // Check on visibility change
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      performanceRegressionDetector.checkForRegressions();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Setup alert logging
  const unsubscribe = performanceRegressionDetector.onRegressionAlert((alert) => {
    console.warn(`🚨 Performance regression detected:`, alert);
    
    // You could integrate with external monitoring services here
    // Example: sendToMonitoringService(alert);
  });

  // Cleanup function
  return () => {
    clearInterval(intervalId);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    unsubscribe();
  };
}