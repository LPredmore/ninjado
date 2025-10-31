# Performance Monitoring Utilities

This directory contains comprehensive performance monitoring utilities for the NinjaDo app. These utilities help track, measure, and optimize application performance.

## Components

### 1. Performance Monitor (`performanceMonitor.ts`)
Core performance measurement utility with timing, memory tracking, and metrics collection.

**Key Features:**
- Start/end performance measurements
- Memory usage tracking
- Cache hit rate monitoring
- Storage operation counting
- Performance bottleneck detection
- React component performance monitoring

**Usage:**
```typescript
import { performanceMonitor, withPerformanceMonitoring, usePerformanceMeasurement } from '@/lib/performanceMonitor';

// Basic measurement
performanceMonitor.startMeasurement('my-operation');
// ... do work
const duration = performanceMonitor.endMeasurement('my-operation');

// HOC for component monitoring
const OptimizedComponent = withPerformanceMonitoring(MyComponent, 'MyComponent');

// Hook for component measurements
function MyComponent() {
  usePerformanceMeasurement('MyComponent-render');
  return <div>Content</div>;
}

// Async operation measurement
const result = await measureAsync('api-call', () => fetch('/api/data'));
```

### 2. Performance Collector (`performanceCollector.ts`)
Baseline collection and performance comparison utility.

**Key Features:**
- Baseline performance collection
- Performance comparison reports
- Metrics history tracking
- Performance regression detection
- Automated monitoring setup

**Usage:**
```typescript
import { performanceCollector, initializePerformanceMonitoring } from '@/lib/performanceCollector';

// Initialize monitoring
const cleanup = initializePerformanceMonitoring();

// Collect baseline
performanceCollector.collectBaseline();

// Get performance report
const report = performanceCollector.getPerformanceReport();

// Check if performance is acceptable
const { acceptable, issues } = performanceCollector.isPerformanceAcceptable();
```

### 3. Performance Dashboard (`PerformanceDashboard.tsx`)
React component for visualizing performance metrics.

**Features:**
- Real-time performance metrics display
- Baseline comparison
- Performance bottleneck visualization
- Interactive controls for data collection

**Usage:**
```typescript
import { PerformanceDashboard } from '@/components/PerformanceDashboard';

function App() {
  return (
    <div>
      <PerformanceDashboard />
    </div>
  );
}
```

### 4. Performance Initialization (`performanceInit.ts`)
App-wide performance monitoring setup.

**Usage:**
```typescript
import { initializeAppPerformanceMonitoring } from '@/lib/performanceInit';

// In your main app file
const cleanup = initializeAppPerformanceMonitoring();

// Development utilities (available at window.performanceUtils)
window.performanceUtils.logMetrics();
window.performanceUtils.logBottlenecks();
window.performanceUtils.exportData();
```

## Bundle Analysis

### Setup
The bundle analyzer is configured in `vite.config.ts` and can be run with:

```bash
npm run build:analyze
```

This generates a `dist/stats.html` file with detailed bundle analysis including:
- Bundle size breakdown
- Chunk analysis
- Gzip/Brotli compression stats
- Module dependencies

### Usage
1. Run `npm run build:analyze`
2. Open `dist/stats.html` in your browser
3. Analyze bundle composition and identify optimization opportunities

## Performance Thresholds

The monitoring system uses these performance thresholds:

- **Render Time**: < 16ms (60fps)
- **Memory Usage**: < 50MB
- **Cache Hit Rate**: > 80%
- **Bundle Size**: Monitor for regressions

## Integration Guide

### 1. App Initialization
Add to your main app file (e.g., `main.tsx`):

```typescript
import { initializeAppPerformanceMonitoring } from '@/lib/performanceInit';

// Initialize performance monitoring
const cleanup = initializeAppPerformanceMonitoring();

// Cleanup on app unmount (if applicable)
window.addEventListener('beforeunload', cleanup);
```

### 2. Component Monitoring
For critical components:

```typescript
import { withPerformanceMonitoring } from '@/lib/performanceMonitor';

const CriticalComponent = withPerformanceMonitoring(MyComponent, 'CriticalComponent');
```

### 3. Query Performance Tracking
For React Query operations:

```typescript
import { performanceMonitor } from '@/lib/performanceMonitor';

const useOptimizedQuery = () => {
  return useQuery({
    queryKey: ['data'],
    queryFn: async () => {
      performanceMonitor.startMeasurement('api-fetch');
      try {
        const result = await fetchData();
        performanceMonitor.trackCacheHit(false); // New data
        return result;
      } finally {
        performanceMonitor.endMeasurement('api-fetch');
      }
    },
    onSuccess: () => {
      performanceMonitor.trackCacheHit(true); // Cache hit on subsequent renders
    }
  });
};
```

### 4. Storage Operation Tracking
For localStorage operations:

```typescript
import { performanceMonitor } from '@/lib/performanceMonitor';

const optimizedStorage = {
  setItem: (key: string, value: string) => {
    performanceMonitor.trackStorageOperation();
    localStorage.setItem(key, value);
  },
  getItem: (key: string) => {
    performanceMonitor.trackStorageOperation();
    return localStorage.getItem(key);
  }
};
```

## Development Tools

In development mode, performance utilities are available globally:

```javascript
// In browser console
window.performanceUtils.logMetrics();        // Current metrics
window.performanceUtils.logBottlenecks();    // Performance issues
window.performanceUtils.exportData();        // Full data export
window.performanceUtils.reset();             // Reset all data
```

## Performance Optimization Workflow

1. **Baseline Collection**: Run the app and collect initial baseline metrics
2. **Monitoring**: Use the dashboard to monitor real-time performance
3. **Analysis**: Use bundle analyzer to identify optimization opportunities
4. **Implementation**: Apply optimizations (memoization, code splitting, etc.)
5. **Validation**: Compare new metrics against baseline
6. **Iteration**: Repeat the process for continuous improvement

## Best Practices

1. **Selective Monitoring**: Don't monitor every component - focus on critical paths
2. **Baseline Management**: Update baselines after significant optimizations
3. **Threshold Monitoring**: Set up alerts for performance regressions
4. **Regular Analysis**: Use bundle analyzer regularly to catch size regressions
5. **Development vs Production**: Use different monitoring strategies for each environment

## Troubleshooting

### High Memory Usage
- Check for memory leaks in event listeners
- Verify proper cleanup in useEffect hooks
- Monitor large object creation in renders

### Slow Render Times
- Use React DevTools Profiler
- Check for unnecessary re-renders
- Implement proper memoization

### Low Cache Hit Rates
- Review query key structures
- Check cache invalidation patterns
- Optimize stale time configurations

### Large Bundle Size
- Use bundle analyzer to identify large dependencies
- Implement code splitting for routes
- Remove unused dependencies