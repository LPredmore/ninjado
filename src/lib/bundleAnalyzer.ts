/**
 * Bundle size analyzer for measuring code splitting effectiveness
 * Provides insights into bundle size optimization and loading performance
 */

import React from 'react';

export interface BundleInfo {
  name: string;
  size: number;
  gzipSize?: number;
  loadTime?: number;
  isLazy: boolean;
}

export interface BundleAnalysis {
  timestamp: number;
  totalSize: number;
  mainBundleSize: number;
  lazyBundlesSize: number;
  bundleCount: number;
  lazyBundleCount: number;
  bundles: BundleInfo[];
  loadingPerformance: {
    initialLoadTime: number;
    lazyLoadTime: number;
    totalLoadTime: number;
  };
  recommendations: string[];
}

class BundleAnalyzerClass {
  private loadTimes = new Map<string, number>();
  private bundleLoadStart = new Map<string, number>();

  /**
   * Analyze current bundle configuration
   */
  analyzeBundles(): BundleAnalysis {
    const bundles = this.detectBundles();
    const loadingPerformance = this.analyzeLoadingPerformance();
    
    const totalSize = bundles.reduce((sum, bundle) => sum + bundle.size, 0);
    const mainBundle = bundles.find(b => b.name.includes('main') || b.name.includes('index'));
    const lazyBundles = bundles.filter(b => b.isLazy);
    
    const analysis: BundleAnalysis = {
      timestamp: Date.now(),
      totalSize,
      mainBundleSize: mainBundle?.size || 0,
      lazyBundlesSize: lazyBundles.reduce((sum, b) => sum + b.size, 0),
      bundleCount: bundles.length,
      lazyBundleCount: lazyBundles.length,
      bundles,
      loadingPerformance,
      recommendations: this.generateRecommendations(bundles, loadingPerformance),
    };

    console.log('📦 Bundle Analysis:', analysis);
    return analysis;
  }

  /**
   * Detect loaded bundles from performance entries
   */
  private detectBundles(): BundleInfo[] {
    const bundles: BundleInfo[] = [];
    
    // Get resource timing entries for JavaScript files
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    resources.forEach(resource => {
      if (resource.name.includes('.js') && !resource.name.includes('node_modules')) {
        const isLazy = this.isLazyBundle(resource.name);
        const size = this.estimateBundleSize(resource);
        
        bundles.push({
          name: this.extractBundleName(resource.name),
          size,
          loadTime: resource.duration,
          isLazy,
        });
      }
    });

    // Add main bundle if not detected
    if (!bundles.some(b => b.name.includes('main'))) {
      bundles.unshift({
        name: 'main',
        size: this.estimateMainBundleSize(),
        isLazy: false,
      });
    }

    return bundles;
  }

  /**
   * Check if a bundle is lazy-loaded
   */
  private isLazyBundle(url: string): boolean {
    // Heuristics to detect lazy bundles
    return url.includes('chunk') || 
           url.includes('lazy') || 
           /\d+\.[a-f0-9]+\.js$/.test(url); // Hash-based chunk names
  }

  /**
   * Extract bundle name from URL
   */
  private extractBundleName(url: string): string {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    return filename.replace(/\.[a-f0-9]+\.js$/, '').replace(/\.js$/, '');
  }

  /**
   * Estimate bundle size from resource timing
   */
  private estimateBundleSize(resource: PerformanceResourceTiming): number {
    // Use transfer size if available, otherwise estimate from duration
    if ('transferSize' in resource && resource.transferSize > 0) {
      return resource.transferSize;
    }
    
    // Rough estimation: 1KB per 1ms of load time (very approximate)
    return Math.max(resource.duration * 1000, 10000); // Minimum 10KB
  }

  /**
   * Estimate main bundle size
   */
  private estimateMainBundleSize(): number {
    // Estimate based on initial page load performance
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      const loadTime = navigation.loadEventEnd - navigation.fetchStart;
      return Math.max(loadTime * 2000, 100000); // Rough estimate: 2KB per ms, minimum 100KB
    }
    
    return 200000; // Default estimate: 200KB
  }

  /**
   * Analyze loading performance
   */
  private analyzeLoadingPerformance(): BundleAnalysis['loadingPerformance'] {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    let initialLoadTime = 0;
    let lazyLoadTime = 0;
    
    if (navigation) {
      initialLoadTime = navigation.loadEventEnd - navigation.fetchStart;
    }
    
    // Calculate average lazy load time
    const lazyLoadTimes = Array.from(this.loadTimes.values());
    if (lazyLoadTimes.length > 0) {
      lazyLoadTime = lazyLoadTimes.reduce((sum, time) => sum + time, 0) / lazyLoadTimes.length;
    }
    
    return {
      initialLoadTime,
      lazyLoadTime,
      totalLoadTime: initialLoadTime + lazyLoadTime,
    };
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(
    bundles: BundleInfo[], 
    performance: BundleAnalysis['loadingPerformance']
  ): string[] {
    const recommendations: string[] = [];
    
    const mainBundle = bundles.find(b => !b.isLazy);
    const lazyBundles = bundles.filter(b => b.isLazy);
    
    // Check main bundle size
    if (mainBundle && mainBundle.size > 500000) { // 500KB
      recommendations.push('Main bundle is large (>500KB). Consider additional code splitting.');
    }
    
    // Check lazy loading adoption
    if (lazyBundles.length === 0) {
      recommendations.push('No lazy bundles detected. Implement code splitting for better performance.');
    } else if (lazyBundles.length < 3) {
      recommendations.push('Limited lazy loading detected. Consider splitting more routes and components.');
    }
    
    // Check loading performance
    if (performance.initialLoadTime > 3000) { // 3 seconds
      recommendations.push('Initial load time is slow (>3s). Optimize critical path and reduce bundle size.');
    }
    
    if (performance.lazyLoadTime > 1000) { // 1 second
      recommendations.push('Lazy loading is slow (>1s). Optimize chunk sizes and loading strategy.');
    }
    
    // Check bundle distribution
    const totalSize = bundles.reduce((sum, b) => sum + b.size, 0);
    const mainBundleRatio = mainBundle ? (mainBundle.size / totalSize) : 1;
    
    if (mainBundleRatio > 0.7) { // 70% in main bundle
      recommendations.push('Main bundle contains too much code (>70%). Increase lazy loading.');
    }
    
    return recommendations;
  }

  /**
   * Track lazy bundle load time
   */
  trackLazyBundleLoad(bundleName: string): void {
    this.bundleLoadStart.set(bundleName, performance.now());
  }

  /**
   * Complete lazy bundle load tracking
   */
  completeLazyBundleLoad(bundleName: string): number {
    const startTime = this.bundleLoadStart.get(bundleName);
    if (startTime) {
      const loadTime = performance.now() - startTime;
      this.loadTimes.set(bundleName, loadTime);
      this.bundleLoadStart.delete(bundleName);
      return loadTime;
    }
    return 0;
  }

  /**
   * Compare bundle analysis with baseline
   */
  compareBundleAnalysis(baseline: BundleAnalysis, current: BundleAnalysis): {
    totalSizeReduction: number;
    mainBundleReduction: number;
    lazyBundleIncrease: number;
    loadTimeImprovement: number;
    improvements: string[];
    regressions: string[];
  } {
    const totalSizeReduction = baseline.totalSize - current.totalSize;
    const mainBundleReduction = baseline.mainBundleSize - current.mainBundleSize;
    const lazyBundleIncrease = current.lazyBundlesSize - baseline.lazyBundlesSize;
    const loadTimeImprovement = baseline.loadingPerformance.initialLoadTime - current.loadingPerformance.initialLoadTime;
    
    const improvements: string[] = [];
    const regressions: string[] = [];
    
    if (totalSizeReduction > 0) {
      improvements.push(`Total bundle size reduced by ${(totalSizeReduction / 1024).toFixed(1)}KB`);
    } else if (totalSizeReduction < 0) {
      regressions.push(`Total bundle size increased by ${Math.abs(totalSizeReduction / 1024).toFixed(1)}KB`);
    }
    
    if (mainBundleReduction > 0) {
      improvements.push(`Main bundle size reduced by ${(mainBundleReduction / 1024).toFixed(1)}KB`);
    } else if (mainBundleReduction < 0) {
      regressions.push(`Main bundle size increased by ${Math.abs(mainBundleReduction / 1024).toFixed(1)}KB`);
    }
    
    if (lazyBundleIncrease > 0) {
      improvements.push(`Lazy bundle usage increased by ${(lazyBundleIncrease / 1024).toFixed(1)}KB`);
    }
    
    if (loadTimeImprovement > 0) {
      improvements.push(`Initial load time improved by ${loadTimeImprovement.toFixed(0)}ms`);
    } else if (loadTimeImprovement < 0) {
      regressions.push(`Initial load time regressed by ${Math.abs(loadTimeImprovement).toFixed(0)}ms`);
    }
    
    if (current.lazyBundleCount > baseline.lazyBundleCount) {
      improvements.push(`Increased lazy bundles from ${baseline.lazyBundleCount} to ${current.lazyBundleCount}`);
    }
    
    return {
      totalSizeReduction,
      mainBundleReduction,
      lazyBundleIncrease,
      loadTimeImprovement,
      improvements,
      regressions,
    };
  }

  /**
   * Get bundle size reduction percentage
   */
  getBundleSizeReduction(baseline: BundleAnalysis, current: BundleAnalysis): number {
    if (baseline.totalSize === 0) return 0;
    return ((baseline.totalSize - current.totalSize) / baseline.totalSize) * 100;
  }
}

// Create singleton instance
export const bundleAnalyzer = new BundleAnalyzerClass();

/**
 * Higher-order component to track lazy component loading
 */
export function withBundleTracking<P extends object>(
  Component: React.ComponentType<P>,
  bundleName: string
): React.ComponentType<P> {
  return (props: P) => {
    React.useEffect(() => {
      bundleAnalyzer.trackLazyBundleLoad(bundleName);
      
      return () => {
        const loadTime = bundleAnalyzer.completeLazyBundleLoad(bundleName);
        if (loadTime > 0) {
          console.log(`📦 Lazy bundle "${bundleName}" loaded in ${loadTime.toFixed(2)}ms`);
        }
      };
    }, []);

    return React.createElement(Component, props);
  };
}