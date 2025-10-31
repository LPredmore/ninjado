import { 
  calculateRoutineEfficiency, 
  calculateOverallEfficiency, 
  TaskCompletion, 
  RoutineEfficiencyResult, 
  OverallEfficiencyResult 
} from './efficiencyUtils';
import { performanceMonitor } from './performanceMonitor';

/**
 * Enhanced efficiency calculation optimizer with advanced caching and batching
 * Provides performance optimizations for routine and overall efficiency calculations
 */

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

interface BatchCalculationRequest {
  id: string;
  tasks: TaskCompletion[];
  priority: 'high' | 'normal' | 'low';
  callback?: (result: RoutineEfficiencyResult) => void;
}

interface OverallEfficiencyBatchRequest {
  id: string;
  efficiencies: number[];
  priority: 'high' | 'normal' | 'low';
  callback?: (result: OverallEfficiencyResult) => void;
}

class EfficiencyCalculationOptimizerClass {
  // Enhanced caching with LRU eviction and access tracking
  private routineCache = new Map<string, CacheEntry<RoutineEfficiencyResult>>();
  private overallCache = new Map<string, CacheEntry<OverallEfficiencyResult>>();
  
  // Batch processing queues
  private routineBatchQueue: BatchCalculationRequest[] = [];
  private overallBatchQueue: OverallEfficiencyBatchRequest[] = [];
  
  // Configuration
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 1000;
  private readonly BATCH_SIZE = 10;
  private readonly BATCH_DELAY = 50; // 50ms
  
  // Batch processing timers
  private routineBatchTimer: NodeJS.Timeout | null = null;
  private overallBatchTimer: NodeJS.Timeout | null = null;
  
  // Performance tracking
  private cacheHits = 0;
  private cacheMisses = 0;
  private batchedCalculations = 0;

  /**
   * Generate cache key for routine efficiency calculation
   */
  private generateRoutineCacheKey(tasks: TaskCompletion[]): string {
    // Create a stable, deterministic key from task data
    const taskData = tasks
      .map(t => `${t.type}:${t.plannedDuration}:${t.actualDuration}`)
      .sort() // Sort to ensure consistent key regardless of order
      .join('|');
    
    // Use a simple hash for shorter keys
    return this.simpleHash(taskData);
  }

  /**
   * Generate cache key for overall efficiency calculation
   */
  private generateOverallCacheKey(efficiencies: number[]): string {
    // Sort efficiencies to ensure consistent key
    const sortedEfficiencies = [...efficiencies].sort((a, b) => a - b);
    const efficiencyData = sortedEfficiencies.join(',');
    return this.simpleHash(efficiencyData);
  }

  /**
   * Simple hash function for cache keys
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Check if cache entry is valid (not expired)
   */
  private isCacheEntryValid<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < this.CACHE_TTL;
  }

  /**
   * Update cache entry access statistics
   */
  private updateCacheAccess<T>(entry: CacheEntry<T>): void {
    entry.accessCount++;
    entry.lastAccessed = Date.now();
  }

  /**
   * Evict least recently used cache entries when cache is full
   */
  private evictLRUEntries<T>(cache: Map<string, CacheEntry<T>>): void {
    if (cache.size <= this.MAX_CACHE_SIZE) return;

    // Sort entries by last accessed time (oldest first)
    const entries = Array.from(cache.entries()).sort(
      ([, a], [, b]) => a.lastAccessed - b.lastAccessed
    );

    // Remove oldest 20% of entries
    const entriesToRemove = Math.floor(cache.size * 0.2);
    for (let i = 0; i < entriesToRemove; i++) {
      cache.delete(entries[i][0]);
    }
  }

  /**
   * Get cached routine efficiency result
   */
  private getCachedRoutineResult(cacheKey: string): RoutineEfficiencyResult | null {
    const entry = this.routineCache.get(cacheKey);
    
    if (!entry || !this.isCacheEntryValid(entry)) {
      if (entry) {
        this.routineCache.delete(cacheKey);
      }
      this.cacheMisses++;
      performanceMonitor.trackCacheHit(false);
      return null;
    }

    this.updateCacheAccess(entry);
    this.cacheHits++;
    performanceMonitor.trackCacheHit(true);
    return entry.value;
  }

  /**
   * Cache routine efficiency result
   */
  private setCachedRoutineResult(cacheKey: string, result: RoutineEfficiencyResult): void {
    this.evictLRUEntries(this.routineCache);
    
    const entry: CacheEntry<RoutineEfficiencyResult> = {
      value: result,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
    };
    
    this.routineCache.set(cacheKey, entry);
  }

  /**
   * Get cached overall efficiency result
   */
  private getCachedOverallResult(cacheKey: string): OverallEfficiencyResult | null {
    const entry = this.overallCache.get(cacheKey);
    
    if (!entry || !this.isCacheEntryValid(entry)) {
      if (entry) {
        this.overallCache.delete(cacheKey);
      }
      this.cacheMisses++;
      performanceMonitor.trackCacheHit(false);
      return null;
    }

    this.updateCacheAccess(entry);
    this.cacheHits++;
    performanceMonitor.trackCacheHit(true);
    return entry.value;
  }

  /**
   * Cache overall efficiency result
   */
  private setCachedOverallResult(cacheKey: string, result: OverallEfficiencyResult): void {
    this.evictLRUEntries(this.overallCache);
    
    const entry: CacheEntry<OverallEfficiencyResult> = {
      value: result,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
    };
    
    this.overallCache.set(cacheKey, entry);
  }

  /**
   * Process routine efficiency batch calculations
   */
  private processRoutineBatch(): void {
    if (this.routineBatchQueue.length === 0) return;

    performanceMonitor.startMeasurement('routine-batch-processing');
    
    // Sort by priority (high -> normal -> low)
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    this.routineBatchQueue.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    
    // Process batch
    const batch = this.routineBatchQueue.splice(0, this.BATCH_SIZE);
    this.batchedCalculations += batch.length;
    
    batch.forEach(request => {
      const cacheKey = this.generateRoutineCacheKey(request.tasks);
      let result = this.getCachedRoutineResult(cacheKey);
      
      if (!result) {
        // Calculate and cache result
        result = calculateRoutineEfficiency(request.tasks);
        this.setCachedRoutineResult(cacheKey, result);
      }
      
      // Execute callback if provided
      if (request.callback) {
        request.callback(result);
      }
    });
    
    performanceMonitor.endMeasurement('routine-batch-processing');
    
    // Schedule next batch if queue is not empty
    if (this.routineBatchQueue.length > 0) {
      this.scheduleRoutineBatch();
    }
  }

  /**
   * Process overall efficiency batch calculations
   */
  private processOverallBatch(): void {
    if (this.overallBatchQueue.length === 0) return;

    performanceMonitor.startMeasurement('overall-batch-processing');
    
    // Sort by priority
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    this.overallBatchQueue.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    
    // Process batch
    const batch = this.overallBatchQueue.splice(0, this.BATCH_SIZE);
    this.batchedCalculations += batch.length;
    
    batch.forEach(request => {
      const cacheKey = this.generateOverallCacheKey(request.efficiencies);
      let result = this.getCachedOverallResult(cacheKey);
      
      if (!result) {
        // Calculate and cache result
        result = calculateOverallEfficiency(request.efficiencies);
        this.setCachedOverallResult(cacheKey, result);
      }
      
      // Execute callback if provided
      if (request.callback) {
        request.callback(result);
      }
    });
    
    performanceMonitor.endMeasurement('overall-batch-processing');
    
    // Schedule next batch if queue is not empty
    if (this.overallBatchQueue.length > 0) {
      this.scheduleOverallBatch();
    }
  }

  /**
   * Schedule routine batch processing
   */
  private scheduleRoutineBatch(): void {
    if (this.routineBatchTimer) {
      clearTimeout(this.routineBatchTimer);
    }
    
    this.routineBatchTimer = setTimeout(() => {
      this.processRoutineBatch();
      this.routineBatchTimer = null;
    }, this.BATCH_DELAY);
  }

  /**
   * Schedule overall efficiency batch processing
   */
  private scheduleOverallBatch(): void {
    if (this.overallBatchTimer) {
      clearTimeout(this.overallBatchTimer);
    }
    
    this.overallBatchTimer = setTimeout(() => {
      this.processOverallBatch();
      this.overallBatchTimer = null;
    }, this.BATCH_DELAY);
  }

  /**
   * Calculate routine efficiency with caching (synchronous)
   */
  calculateRoutineEfficiencyOptimized(tasks: TaskCompletion[]): RoutineEfficiencyResult {
    performanceMonitor.startMeasurement('routine-efficiency-optimized');
    
    const cacheKey = this.generateRoutineCacheKey(tasks);
    let result = this.getCachedRoutineResult(cacheKey);
    
    if (!result) {
      // Calculate and cache result
      result = calculateRoutineEfficiency(tasks);
      this.setCachedRoutineResult(cacheKey, result);
    }
    
    performanceMonitor.endMeasurement('routine-efficiency-optimized');
    return result;
  }

  /**
   * Calculate routine efficiency with batching (asynchronous)
   */
  calculateRoutineEfficiencyBatched(
    tasks: TaskCompletion[],
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<RoutineEfficiencyResult> {
    return new Promise((resolve) => {
      const requestId = `routine-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      
      const request: BatchCalculationRequest = {
        id: requestId,
        tasks,
        priority,
        callback: resolve,
      };
      
      this.routineBatchQueue.push(request);
      this.scheduleRoutineBatch();
    });
  }

  /**
   * Calculate overall efficiency with caching (synchronous)
   */
  calculateOverallEfficiencyOptimized(efficiencies: number[]): OverallEfficiencyResult {
    performanceMonitor.startMeasurement('overall-efficiency-optimized');
    
    const cacheKey = this.generateOverallCacheKey(efficiencies);
    let result = this.getCachedOverallResult(cacheKey);
    
    if (!result) {
      // Calculate and cache result
      result = calculateOverallEfficiency(efficiencies);
      this.setCachedOverallResult(cacheKey, result);
    }
    
    performanceMonitor.endMeasurement('overall-efficiency-optimized');
    return result;
  }

  /**
   * Calculate overall efficiency with batching (asynchronous)
   */
  calculateOverallEfficiencyBatched(
    efficiencies: number[],
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<OverallEfficiencyResult> {
    return new Promise((resolve) => {
      const requestId = `overall-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      
      const request: OverallEfficiencyBatchRequest = {
        id: requestId,
        efficiencies,
        priority,
        callback: resolve,
      };
      
      this.overallBatchQueue.push(request);
      this.scheduleOverallBatch();
    });
  }

  /**
   * Batch calculate multiple routine efficiencies
   */
  async batchCalculateRoutineEfficiencies(
    calculations: Array<{ tasks: TaskCompletion[]; priority?: 'high' | 'normal' | 'low' }>
  ): Promise<RoutineEfficiencyResult[]> {
    const promises = calculations.map(calc => 
      this.calculateRoutineEfficiencyBatched(calc.tasks, calc.priority || 'normal')
    );
    
    return Promise.all(promises);
  }

  /**
   * Preload calculations into cache
   */
  preloadCalculations(
    routineCalculations: TaskCompletion[][],
    overallCalculations: number[][]
  ): void {
    performanceMonitor.startMeasurement('cache-preload');
    
    // Preload routine calculations
    routineCalculations.forEach(tasks => {
      const cacheKey = this.generateRoutineCacheKey(tasks);
      if (!this.getCachedRoutineResult(cacheKey)) {
        const result = calculateRoutineEfficiency(tasks);
        this.setCachedRoutineResult(cacheKey, result);
      }
    });
    
    // Preload overall calculations
    overallCalculations.forEach(efficiencies => {
      const cacheKey = this.generateOverallCacheKey(efficiencies);
      if (!this.getCachedOverallResult(cacheKey)) {
        const result = calculateOverallEfficiency(efficiencies);
        this.setCachedOverallResult(cacheKey, result);
      }
    });
    
    performanceMonitor.endMeasurement('cache-preload');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    routineCacheSize: number;
    overallCacheSize: number;
    cacheHitRate: number;
    totalCalculations: number;
    batchedCalculations: number;
    queueSizes: {
      routine: number;
      overall: number;
    };
  } {
    const totalRequests = this.cacheHits + this.cacheMisses;
    const hitRate = totalRequests > 0 ? (this.cacheHits / totalRequests) * 100 : 0;
    
    return {
      routineCacheSize: this.routineCache.size,
      overallCacheSize: this.overallCache.size,
      cacheHitRate: hitRate,
      totalCalculations: totalRequests,
      batchedCalculations: this.batchedCalculations,
      queueSizes: {
        routine: this.routineBatchQueue.length,
        overall: this.overallBatchQueue.length,
      },
    };
  }

  /**
   * Clear all caches and reset statistics
   */
  clearCache(): void {
    this.routineCache.clear();
    this.overallCache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.batchedCalculations = 0;
    
    // Clear batch queues
    this.routineBatchQueue = [];
    this.overallBatchQueue = [];
    
    // Clear timers
    if (this.routineBatchTimer) {
      clearTimeout(this.routineBatchTimer);
      this.routineBatchTimer = null;
    }
    if (this.overallBatchTimer) {
      clearTimeout(this.overallBatchTimer);
      this.overallBatchTimer = null;
    }
  }

  /**
   * Cleanup expired cache entries
   */
  cleanupExpiredEntries(): void {
    const now = Date.now();
    
    // Clean routine cache
    for (const [key, entry] of this.routineCache.entries()) {
      if (now - entry.timestamp > this.CACHE_TTL) {
        this.routineCache.delete(key);
      }
    }
    
    // Clean overall cache
    for (const [key, entry] of this.overallCache.entries()) {
      if (now - entry.timestamp > this.CACHE_TTL) {
        this.overallCache.delete(key);
      }
    }
  }
}

// Create singleton instance
export const efficiencyCalculationOptimizer = new EfficiencyCalculationOptimizerClass();

// Set up periodic cache cleanup
setInterval(() => {
  efficiencyCalculationOptimizer.cleanupExpiredEntries();
}, 60000); // Clean up every minute