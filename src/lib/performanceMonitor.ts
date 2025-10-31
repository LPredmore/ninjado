import React from 'react';

/**
 * Performance monitoring utility for measuring and tracking app performance
 * Provides capabilities for timing measurements, memory usage tracking, and performance metrics collection
 */

export interface PerformanceMetrics {
  renderTime: number;
  componentCount: number;
  memoryUsage: number;
  cacheHitRate: number;
  storageOperations: number;
  timestamp: number;
}

export interface MeasurementResult {
  name: string;
  duration: number;
  startTime: number;
  endTime: number;
}

class PerformanceMonitorClass {
  private measurements = new Map<string, number>();
  private completedMeasurements: MeasurementResult[] = [];
  private metrics: Partial<PerformanceMetrics> = {};
  private storageOperationCount = 0;
  private cacheHits = 0;
  private cacheRequests = 0;

  /**
   * Start a performance measurement
   */
  startMeasurement(name: string): void {
    const startTime = performance.now();
    this.measurements.set(name, startTime);
    
    // Use Performance API mark if available
    if (performance.mark) {
      performance.mark(`${name}-start`);
    }
  }

  /**
   * End a performance measurement and return the duration
   */
  endMeasurement(name: string): number {
    const endTime = performance.now();
    const startTime = this.measurements.get(name);
    
    if (!startTime) {
      console.warn(`No start measurement found for: ${name}`);
      return 0;
    }

    const duration = endTime - startTime;
    
    // Store completed measurement
    this.completedMeasurements.push({
      name,
      duration,
      startTime,
      endTime,
    });

    // Use Performance API measure if available
    if (performance.measure && performance.mark) {
      try {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
      } catch (error) {
        // Silently handle cases where marks don't exist
      }
    }

    // Clean up
    this.measurements.delete(name);
    
    return duration;
  }

  /**
   * Get memory usage information
   */
  getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize || 0;
    }
    return 0;
  }

  /**
   * Track cache hit/miss for cache hit rate calculation
   */
  trackCacheHit(isHit: boolean): void {
    this.cacheRequests++;
    if (isHit) {
      this.cacheHits++;
    }
  }

  /**
   * Track storage operations
   */
  trackStorageOperation(): void {
    this.storageOperationCount++;
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    const cacheHitRate = this.cacheRequests > 0 ? (this.cacheHits / this.cacheRequests) * 100 : 0;
    
    return {
      renderTime: this.getAverageRenderTime(),
      componentCount: this.getComponentCount(),
      memoryUsage: this.getMemoryUsage(),
      cacheHitRate,
      storageOperations: this.storageOperationCount,
      timestamp: Date.now(),
    };
  }

  /**
   * Get average render time from recent measurements
   */
  private getAverageRenderTime(): number {
    const renderMeasurements = this.completedMeasurements
      .filter(m => m.name.includes('render') || m.name.includes('component'))
      .slice(-10); // Last 10 measurements
    
    if (renderMeasurements.length === 0) return 0;
    
    const totalTime = renderMeasurements.reduce((sum, m) => sum + m.duration, 0);
    return totalTime / renderMeasurements.length;
  }

  /**
   * Estimate component count (simplified approach)
   */
  private getComponentCount(): number {
    // This is a simplified estimation - in a real app you might track this more precisely
    const componentMeasurements = this.completedMeasurements
      .filter(m => m.name.includes('component'))
      .length;
    
    return componentMeasurements;
  }

  /**
   * Report performance bottlenecks
   */
  reportBottlenecks(): string[] {
    const bottlenecks: string[] = [];
    const slowMeasurements = this.completedMeasurements
      .filter(m => m.duration > 16) // Slower than 60fps threshold
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);

    slowMeasurements.forEach(measurement => {
      bottlenecks.push(`${measurement.name}: ${measurement.duration.toFixed(2)}ms`);
    });

    const metrics = this.getMetrics();
    
    if (metrics.cacheHitRate < 80) {
      bottlenecks.push(`Low cache hit rate: ${metrics.cacheHitRate.toFixed(1)}%`);
    }
    
    if (metrics.memoryUsage > 50 * 1024 * 1024) { // 50MB
      bottlenecks.push(`High memory usage: ${(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB`);
    }

    return bottlenecks;
  }

  /**
   * Get all completed measurements
   */
  getMeasurements(): MeasurementResult[] {
    return [...this.completedMeasurements];
  }

  /**
   * Clear all measurements and reset counters
   */
  reset(): void {
    this.measurements.clear();
    this.completedMeasurements = [];
    this.storageOperationCount = 0;
    this.cacheHits = 0;
    this.cacheRequests = 0;
  }

  /**
   * Export performance data for analysis
   */
  exportData(): {
    measurements: MeasurementResult[];
    metrics: PerformanceMetrics;
    bottlenecks: string[];
  } {
    return {
      measurements: this.getMeasurements(),
      metrics: this.getMetrics(),
      bottlenecks: this.reportBottlenecks(),
    };
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitorClass();

/**
 * Higher-order component for measuring component render performance
 */
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
): React.ComponentType<P> {
  const displayName = componentName || Component.displayName || Component.name || 'Component';
  
  const WrappedComponent = (props: P) => {
    React.useEffect(() => {
      performanceMonitor.startMeasurement(`${displayName}-render`);
      
      return () => {
        performanceMonitor.endMeasurement(`${displayName}-render`);
      };
    });

    return React.createElement(Component, props);
  };

  WrappedComponent.displayName = `withPerformanceMonitoring(${displayName})`;
  
  return WrappedComponent;
}

/**
 * Hook for measuring performance within components
 */
export function usePerformanceMeasurement(measurementName: string, dependencies: React.DependencyList = []) {
  React.useEffect(() => {
    performanceMonitor.startMeasurement(measurementName);
    
    return () => {
      performanceMonitor.endMeasurement(measurementName);
    };
  }, dependencies);
}

/**
 * Utility function to measure async operations
 */
export async function measureAsync<T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> {
  performanceMonitor.startMeasurement(name);
  
  try {
    const result = await operation();
    return result;
  } finally {
    performanceMonitor.endMeasurement(name);
  }
}

/**
 * Utility function to measure synchronous operations
 */
export function measureSync<T>(
  name: string,
  operation: () => T
): T {
  performanceMonitor.startMeasurement(name);
  
  try {
    const result = operation();
    return result;
  } finally {
    performanceMonitor.endMeasurement(name);
  }
}