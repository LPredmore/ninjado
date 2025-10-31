import { performanceMonitor } from './performanceMonitor';

/**
 * Memory leak detection system for identifying and preventing memory issues
 * Monitors memory usage patterns and detects potential leaks
 */

export interface MemorySnapshot {
  timestamp: number;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  componentCount?: number;
  eventListenerCount?: number;
}

export interface MemoryLeakAlert {
  id: string;
  timestamp: number;
  type: 'gradual_increase' | 'sudden_spike' | 'high_usage' | 'component_leak';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  memoryIncrease: number;
  recommendations: string[];
}

export interface MemoryAnalysis {
  timestamp: number;
  currentUsage: number;
  trend: 'stable' | 'increasing' | 'decreasing';
  leakSuspected: boolean;
  alerts: MemoryLeakAlert[];
  recommendations: string[];
}

class MemoryLeakDetectorClass {
  private snapshots: MemorySnapshot[] = [];
  private readonly MAX_SNAPSHOTS = 100;
  private readonly SNAPSHOT_INTERVAL = 30000; // 30 seconds
  private intervalId: number | null = null;
  private componentRegistry = new Map<string, number>();
  private eventListenerRegistry = new Set<string>();

  /**
   * Start memory monitoring
   */
  startMonitoring(): void {
    if (this.intervalId) {
      console.warn('Memory monitoring already started');
      return;
    }

    console.log('🧠 Starting memory leak detection...');
    
    // Take initial snapshot
    this.takeSnapshot();
    
    // Set up periodic snapshots
    this.intervalId = window.setInterval(() => {
      this.takeSnapshot();
      this.analyzeMemoryTrends();
    }, this.SNAPSHOT_INTERVAL);
  }

  /**
   * Stop memory monitoring
   */
  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🧠 Memory monitoring stopped');
    }
  }

  /**
   * Take a memory snapshot
   */
  takeSnapshot(): MemorySnapshot {
    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      usedJSHeapSize: this.getMemoryUsage(),
      totalJSHeapSize: this.getTotalHeapSize(),
      jsHeapSizeLimit: this.getHeapSizeLimit(),
      componentCount: this.getComponentCount(),
      eventListenerCount: this.getEventListenerCount(),
    };

    this.snapshots.push(snapshot);
    
    // Keep only recent snapshots
    if (this.snapshots.length > this.MAX_SNAPSHOTS) {
      this.snapshots = this.snapshots.slice(-this.MAX_SNAPSHOTS);
    }

    return snapshot;
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize || 0;
    }
    return 0;
  }

  /**
   * Get total heap size
   */
  private getTotalHeapSize(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.totalJSHeapSize || 0;
    }
    return 0;
  }

  /**
   * Get heap size limit
   */
  private getHeapSizeLimit(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.jsHeapSizeLimit || 0;
    }
    return 0;
  }

  /**
   * Get estimated component count
   */
  private getComponentCount(): number {
    return this.componentRegistry.size;
  }

  /**
   * Get estimated event listener count
   */
  private getEventListenerCount(): number {
    return this.eventListenerRegistry.size;
  }

  /**
   * Register a component mount
   */
  registerComponent(componentName: string): void {
    const count = this.componentRegistry.get(componentName) || 0;
    this.componentRegistry.set(componentName, count + 1);
  }

  /**
   * Register a component unmount
   */
  unregisterComponent(componentName: string): void {
    const count = this.componentRegistry.get(componentName) || 0;
    if (count > 1) {
      this.componentRegistry.set(componentName, count - 1);
    } else {
      this.componentRegistry.delete(componentName);
    }
  }

  /**
   * Register an event listener
   */
  registerEventListener(listenerId: string): void {
    this.eventListenerRegistry.add(listenerId);
  }

  /**
   * Unregister an event listener
   */
  unregisterEventListener(listenerId: string): void {
    this.eventListenerRegistry.delete(listenerId);
  }

  /**
   * Analyze memory trends and detect leaks
   */
  analyzeMemoryTrends(): MemoryAnalysis {
    if (this.snapshots.length < 3) {
      return {
        timestamp: Date.now(),
        currentUsage: this.getMemoryUsage(),
        trend: 'stable',
        leakSuspected: false,
        alerts: [],
        recommendations: [],
      };
    }

    const recent = this.snapshots.slice(-10); // Last 10 snapshots
    const alerts: MemoryLeakAlert[] = [];
    
    // Check for gradual memory increase
    const gradualIncreaseAlert = this.checkGradualIncrease(recent);
    if (gradualIncreaseAlert) alerts.push(gradualIncreaseAlert);
    
    // Check for sudden memory spikes
    const spikeAlert = this.checkSuddenSpike(recent);
    if (spikeAlert) alerts.push(spikeAlert);
    
    // Check for high memory usage
    const highUsageAlert = this.checkHighUsage(recent);
    if (highUsageAlert) alerts.push(highUsageAlert);
    
    // Check for component leaks
    const componentLeakAlert = this.checkComponentLeaks();
    if (componentLeakAlert) alerts.push(componentLeakAlert);

    const trend = this.determineTrend(recent);
    const leakSuspected = alerts.some(a => a.severity === 'high' || a.severity === 'critical');
    
    const analysis: MemoryAnalysis = {
      timestamp: Date.now(),
      currentUsage: recent[recent.length - 1].usedJSHeapSize,
      trend,
      leakSuspected,
      alerts,
      recommendations: this.generateRecommendations(alerts),
    };

    if (leakSuspected) {
      console.warn('🚨 Memory leak suspected:', analysis);
    }

    return analysis;
  }

  /**
   * Check for gradual memory increase
   */
  private checkGradualIncrease(snapshots: MemorySnapshot[]): MemoryLeakAlert | null {
    if (snapshots.length < 5) return null;

    const first = snapshots[0];
    const last = snapshots[snapshots.length - 1];
    const increase = last.usedJSHeapSize - first.usedJSHeapSize;
    const timeSpan = last.timestamp - first.timestamp;
    const increaseRate = increase / (timeSpan / 1000); // bytes per second

    // Alert if memory increases by more than 1KB per second consistently
    if (increaseRate > 1024) {
      return {
        id: `gradual-increase-${Date.now()}`,
        timestamp: Date.now(),
        type: 'gradual_increase',
        severity: increaseRate > 5120 ? 'critical' : increaseRate > 2048 ? 'high' : 'medium',
        description: `Memory usage increasing at ${(increaseRate / 1024).toFixed(2)}KB/s`,
        memoryIncrease: increase,
        recommendations: [
          'Check for event listeners not being removed',
          'Review component cleanup in useEffect',
          'Look for circular references in objects',
        ],
      };
    }

    return null;
  }

  /**
   * Check for sudden memory spikes
   */
  private checkSuddenSpike(snapshots: MemorySnapshot[]): MemoryLeakAlert | null {
    if (snapshots.length < 2) return null;

    for (let i = 1; i < snapshots.length; i++) {
      const prev = snapshots[i - 1];
      const curr = snapshots[i];
      const increase = curr.usedJSHeapSize - prev.usedJSHeapSize;
      
      // Alert if memory increases by more than 10MB in one snapshot
      if (increase > 10 * 1024 * 1024) {
        return {
          id: `spike-${Date.now()}`,
          timestamp: Date.now(),
          type: 'sudden_spike',
          severity: increase > 50 * 1024 * 1024 ? 'critical' : 'high',
          description: `Sudden memory spike of ${(increase / 1024 / 1024).toFixed(1)}MB`,
          memoryIncrease: increase,
          recommendations: [
            'Check recent component mounts or data loading',
            'Review large object allocations',
            'Look for memory-intensive operations',
          ],
        };
      }
    }

    return null;
  }

  /**
   * Check for high memory usage
   */
  private checkHighUsage(snapshots: MemorySnapshot[]): MemoryLeakAlert | null {
    const latest = snapshots[snapshots.length - 1];
    const usageMB = latest.usedJSHeapSize / 1024 / 1024;
    
    // Alert if memory usage exceeds thresholds
    if (usageMB > 100) { // 100MB
      return {
        id: `high-usage-${Date.now()}`,
        timestamp: Date.now(),
        type: 'high_usage',
        severity: usageMB > 200 ? 'critical' : usageMB > 150 ? 'high' : 'medium',
        description: `High memory usage: ${usageMB.toFixed(1)}MB`,
        memoryIncrease: 0,
        recommendations: [
          'Consider implementing data pagination',
          'Review component memoization',
          'Check for large cached objects',
        ],
      };
    }

    return null;
  }

  /**
   * Check for component leaks
   */
  private checkComponentLeaks(): MemoryLeakAlert | null {
    const suspiciousComponents: string[] = [];
    
    this.componentRegistry.forEach((count, name) => {
      // Alert if a component has more than 50 instances
      if (count > 50) {
        suspiciousComponents.push(`${name} (${count} instances)`);
      }
    });

    if (suspiciousComponents.length > 0) {
      return {
        id: `component-leak-${Date.now()}`,
        timestamp: Date.now(),
        type: 'component_leak',
        severity: suspiciousComponents.length > 3 ? 'critical' : 'high',
        description: `Potential component leaks detected: ${suspiciousComponents.join(', ')}`,
        memoryIncrease: 0,
        recommendations: [
          'Check component unmounting logic',
          'Review component key props',
          'Ensure proper cleanup in useEffect',
        ],
      };
    }

    return null;
  }

  /**
   * Determine memory usage trend
   */
  private determineTrend(snapshots: MemorySnapshot[]): 'stable' | 'increasing' | 'decreasing' {
    if (snapshots.length < 3) return 'stable';

    const first = snapshots[0].usedJSHeapSize;
    const last = snapshots[snapshots.length - 1].usedJSHeapSize;
    const change = last - first;
    const threshold = first * 0.1; // 10% change threshold

    if (change > threshold) return 'increasing';
    if (change < -threshold) return 'decreasing';
    return 'stable';
  }

  /**
   * Generate recommendations based on alerts
   */
  private generateRecommendations(alerts: MemoryLeakAlert[]): string[] {
    const recommendations = new Set<string>();
    
    alerts.forEach(alert => {
      alert.recommendations.forEach(rec => recommendations.add(rec));
    });

    // Add general recommendations
    if (alerts.length > 0) {
      recommendations.add('Use React DevTools Profiler to identify memory issues');
      recommendations.add('Consider implementing component lazy loading');
    }

    return Array.from(recommendations);
  }

  /**
   * Get memory snapshots
   */
  getSnapshots(): MemorySnapshot[] {
    return [...this.snapshots];
  }

  /**
   * Get latest memory analysis
   */
  getLatestAnalysis(): MemoryAnalysis {
    return this.analyzeMemoryTrends();
  }

  /**
   * Clear snapshots and reset monitoring
   */
  reset(): void {
    this.snapshots = [];
    this.componentRegistry.clear();
    this.eventListenerRegistry.clear();
  }

  /**
   * Force garbage collection (if available)
   */
  forceGarbageCollection(): void {
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
      console.log('🗑️ Forced garbage collection');
    } else {
      console.warn('Garbage collection not available in this environment');
    }
  }
}

// Create singleton instance
export const memoryLeakDetector = new MemoryLeakDetectorClass();

/**
 * Higher-order component for tracking component lifecycle
 */
export function withMemoryTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
): React.ComponentType<P> {
  const displayName = componentName || Component.displayName || Component.name || 'Component';
  
  return (props: P) => {
    React.useEffect(() => {
      memoryLeakDetector.registerComponent(displayName);
      
      return () => {
        memoryLeakDetector.unregisterComponent(displayName);
      };
    }, []);

    return React.createElement(Component, props);
  };
}

/**
 * Hook for tracking event listeners
 */
export function useMemoryTrackedEventListener(
  target: EventTarget | null,
  event: string,
  handler: EventListener,
  options?: boolean | AddEventListenerOptions
): void {
  React.useEffect(() => {
    if (!target) return;

    const listenerId = `${event}-${Date.now()}-${Math.random()}`;
    memoryLeakDetector.registerEventListener(listenerId);
    
    target.addEventListener(event, handler, options);
    
    return () => {
      target.removeEventListener(event, handler, options);
      memoryLeakDetector.unregisterEventListener(listenerId);
    };
  }, [target, event, handler, options]);
}

/**
 * Initialize memory leak detection
 */
export function initializeMemoryLeakDetection(): () => void {
  memoryLeakDetector.startMonitoring();
  
  return () => {
    memoryLeakDetector.stopMonitoring();
  };
}