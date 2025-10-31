import { supabase } from "@/integrations/supabase/client";
import { performanceMonitor } from './performanceMonitor';
import { efficiencyCalculationOptimizer } from './efficiencyCalculationOptimizer';

/**
 * Optimized historical data processor for efficiency calculations
 * Provides efficient algorithms for processing large datasets with pagination and windowing
 */

export interface HistoricalDataWindow {
  startDate: Date;
  endDate: Date;
  completions: Array<{
    id: string;
    completed_at: string;
    efficiency_percentage: number | null;
    total_time_saved: number;
    total_routine_duration: number;
  }>;
}

export interface ProcessingOptions {
  windowSize?: number; // Number of days per window
  batchSize?: number; // Number of records to process at once
  useCache?: boolean; // Whether to use caching
  priority?: 'high' | 'normal' | 'low'; // Processing priority
}

export interface GraceSystemOptimizedResult {
  finalEfficiency: number;
  graceSystemPenalty: number;
  negativeRoutineCount: number;
  processedWindows: number;
  totalProcessingTime: number;
}

class HistoricalDataProcessorClass {
  private readonly DEFAULT_WINDOW_SIZE = 7; // 7 days per window
  private readonly DEFAULT_BATCH_SIZE = 50; // 50 records per batch
  private readonly MAX_CONCURRENT_WINDOWS = 3; // Maximum concurrent window processing

  /**
   * Fetch historical data with pagination and date windowing
   */
  async fetchHistoricalDataWindowed(
    userId: string,
    startDate: Date,
    endDate: Date,
    options: ProcessingOptions = {}
  ): Promise<HistoricalDataWindow[]> {
    const windowSize = options.windowSize || this.DEFAULT_WINDOW_SIZE;
    const batchSize = options.batchSize || this.DEFAULT_BATCH_SIZE;
    
    performanceMonitor.startMeasurement('historical-data-fetch');
    
    const windows: HistoricalDataWindow[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const windowStart = new Date(currentDate);
      const windowEnd = new Date(currentDate);
      windowEnd.setDate(windowEnd.getDate() + windowSize - 1);
      
      // Don't exceed the end date
      if (windowEnd > endDate) {
        windowEnd.setTime(endDate.getTime());
      }
      
      // Fetch data for this window with pagination
      const completions = await this.fetchWindowData(
        userId,
        windowStart,
        windowEnd,
        batchSize
      );
      
      windows.push({
        startDate: windowStart,
        endDate: windowEnd,
        completions,
      });
      
      // Move to next window
      currentDate.setDate(currentDate.getDate() + windowSize);
    }
    
    performanceMonitor.endMeasurement('historical-data-fetch');
    return windows;
  }

  /**
   * Fetch data for a specific window with pagination
   */
  private async fetchWindowData(
    userId: string,
    startDate: Date,
    endDate: Date,
    batchSize: number
  ): Promise<Array<{
    id: string;
    completed_at: string;
    efficiency_percentage: number | null;
    total_time_saved: number;
    total_routine_duration: number;
  }>> {
    const allCompletions: Array<{
      id: string;
      completed_at: string;
      efficiency_percentage: number | null;
      total_time_saved: number;
      total_routine_duration: number;
    }> = [];
    
    let offset = 0;
    let hasMore = true;
    
    while (hasMore) {
      const { data, error } = await supabase
        .from("routine_completions")
        .select("id, completed_at, efficiency_percentage, total_time_saved, total_routine_duration")
        .eq("user_id", userId)
        .eq("has_regular_tasks", true)
        .gte("completed_at", startDate.toISOString())
        .lte("completed_at", endDate.toISOString())
        .order("completed_at", { ascending: false })
        .range(offset, offset + batchSize - 1);

      if (error) {
        console.error("Error fetching historical data:", error);
        break;
      }

      if (!data || data.length === 0) {
        hasMore = false;
      } else {
        allCompletions.push(...data);
        offset += batchSize;
        
        // If we got fewer records than batch size, we've reached the end
        if (data.length < batchSize) {
          hasMore = false;
        }
      }
    }
    
    return allCompletions;
  }

  /**
   * Process efficiency data with optimized Grace System calculation
   * Uses windowing and parallel processing for large datasets
   */
  async processEfficiencyDataOptimized(
    userId: string,
    days: number = 30,
    options: ProcessingOptions = {}
  ): Promise<GraceSystemOptimizedResult> {
    performanceMonitor.startMeasurement('efficiency-data-processing');
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Fetch data in windows for better memory management
    const windows = await this.fetchHistoricalDataWindowed(
      userId,
      startDate,
      endDate,
      options
    );
    
    // Process windows in parallel (limited concurrency)
    const windowResults = await this.processWindowsInParallel(windows, options);
    
    // Combine results from all windows
    const allEfficiencies: number[] = [];
    
    for (const windowResult of windowResults) {
      allEfficiencies.push(...windowResult.efficiencies);
    }
    
    // Calculate final Grace System result
    let finalResult: GraceSystemOptimizedResult;
    
    if (options.useCache !== false) {
      // Use optimized calculation with caching
      const graceResult = efficiencyCalculationOptimizer.calculateOverallEfficiencyOptimized(allEfficiencies);
      finalResult = {
        finalEfficiency: graceResult.finalEfficiency,
        graceSystemPenalty: graceResult.graceSystemPenalty,
        negativeRoutineCount: graceResult.negativeRoutineCount,
        processedWindows: windows.length,
        totalProcessingTime: performanceMonitor.endMeasurement('efficiency-data-processing'),
      };
    } else {
      // Direct calculation without caching
      const graceResult = this.calculateGraceSystemOptimized(allEfficiencies);
      finalResult = {
        ...graceResult,
        processedWindows: windows.length,
        totalProcessingTime: performanceMonitor.endMeasurement('efficiency-data-processing'),
      };
    }
    
    return finalResult;
  }

  /**
   * Process multiple windows in parallel with limited concurrency
   */
  private async processWindowsInParallel(
    windows: HistoricalDataWindow[],
    options: ProcessingOptions
  ): Promise<Array<{ efficiencies: number[]; windowIndex: number }>> {
    const results: Array<{ efficiencies: number[]; windowIndex: number }> = [];
    
    // Process windows in batches to limit memory usage
    for (let i = 0; i < windows.length; i += this.MAX_CONCURRENT_WINDOWS) {
      const windowBatch = windows.slice(i, i + this.MAX_CONCURRENT_WINDOWS);
      
      const batchPromises = windowBatch.map(async (window, batchIndex) => {
        const windowIndex = i + batchIndex;
        const efficiencies = await this.processWindowEfficiencies(window, options);
        return { efficiencies, windowIndex };
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    // Sort results by window index to maintain chronological order
    return results.sort((a, b) => a.windowIndex - b.windowIndex);
  }

  /**
   * Process efficiencies for a single window
   */
  private async processWindowEfficiencies(
    window: HistoricalDataWindow,
    options: ProcessingOptions
  ): Promise<number[]> {
    performanceMonitor.startMeasurement(`window-processing-${window.startDate.getTime()}`);
    
    const efficiencies: number[] = [];
    
    // Process completions in batches
    const batchSize = options.batchSize || this.DEFAULT_BATCH_SIZE;
    
    for (let i = 0; i < window.completions.length; i += batchSize) {
      const batch = window.completions.slice(i, i + batchSize);
      
      for (const completion of batch) {
        let efficiency = completion.efficiency_percentage;
        
        // Handle backward compatibility for null efficiency values
        if (efficiency === null && 
            completion.total_time_saved !== null && 
            completion.total_routine_duration !== null &&
            completion.total_routine_duration > 0) {
          // Use legacy formula for backward compatibility
          efficiency = (completion.total_time_saved / completion.total_routine_duration) * 100;
        }
        
        if (efficiency !== null && !isNaN(efficiency)) {
          efficiencies.push(efficiency);
        }
      }
    }
    
    performanceMonitor.endMeasurement(`window-processing-${window.startDate.getTime()}`);
    return efficiencies;
  }

  /**
   * Optimized Grace System calculation with early termination
   */
  private calculateGraceSystemOptimized(efficiencies: number[]): {
    finalEfficiency: number;
    graceSystemPenalty: number;
    negativeRoutineCount: number;
  } {
    if (efficiencies.length === 0) {
      return {
        finalEfficiency: 0,
        graceSystemPenalty: 0,
        negativeRoutineCount: 0,
      };
    }

    // Calculate average efficiency
    const sum = efficiencies.reduce((acc, eff) => acc + eff, 0);
    const averageEfficiency = sum / efficiencies.length;

    // Count negative efficiencies with early termination optimization
    let negativeCount = 0;
    let negativeSum = 0;
    
    for (const efficiency of efficiencies) {
      if (efficiency < 0) {
        negativeCount++;
        negativeSum += efficiency;
        
        // Early termination: if we already have 4+ negatives,
        // we know penalty will apply, so we can continue counting
        // but we don't need to check the condition repeatedly
      }
    }

    // Apply Grace System penalty logic
    let graceSystemPenalty = 0;
    
    if (negativeCount >= 4) {
      // Calculate penalty: 2 × sum of all negative efficiency scores
      graceSystemPenalty = 2 * Math.abs(negativeSum);
    }

    const finalEfficiency = averageEfficiency - graceSystemPenalty;

    return {
      finalEfficiency,
      graceSystemPenalty,
      negativeRoutineCount: negativeCount,
    };
  }

  /**
   * Get efficiency trends over time with optimized processing
   */
  async getEfficiencyTrends(
    userId: string,
    days: number = 90,
    intervalDays: number = 7
  ): Promise<Array<{
    startDate: Date;
    endDate: Date;
    averageEfficiency: number;
    completionCount: number;
    trendDirection: 'up' | 'down' | 'stable';
  }>> {
    performanceMonitor.startMeasurement('efficiency-trends');
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const windows = await this.fetchHistoricalDataWindowed(
      userId,
      startDate,
      endDate,
      { windowSize: intervalDays }
    );
    
    const trends = await Promise.all(
      windows.map(async (window, index) => {
        const efficiencies = await this.processWindowEfficiencies(window, {});
        const averageEfficiency = efficiencies.length > 0 
          ? efficiencies.reduce((sum, eff) => sum + eff, 0) / efficiencies.length 
          : 0;
        
        // Determine trend direction compared to previous window
        let trendDirection: 'up' | 'down' | 'stable' = 'stable';
        if (index > 0) {
          const previousWindow = windows[index - 1];
          const previousEfficiencies = await this.processWindowEfficiencies(previousWindow, {});
          const previousAverage = previousEfficiencies.length > 0
            ? previousEfficiencies.reduce((sum, eff) => sum + eff, 0) / previousEfficiencies.length
            : 0;
          
          const difference = averageEfficiency - previousAverage;
          if (Math.abs(difference) > 2) { // 2% threshold for trend detection
            trendDirection = difference > 0 ? 'up' : 'down';
          }
        }
        
        return {
          startDate: window.startDate,
          endDate: window.endDate,
          averageEfficiency,
          completionCount: efficiencies.length,
          trendDirection,
        };
      })
    );
    
    performanceMonitor.endMeasurement('efficiency-trends');
    return trends;
  }

  /**
   * Preload historical data for faster subsequent queries
   */
  async preloadHistoricalData(
    userId: string,
    days: number = 30
  ): Promise<void> {
    performanceMonitor.startMeasurement('historical-data-preload');
    
    try {
      // Fetch and process data to populate caches
      await this.processEfficiencyDataOptimized(userId, days, {
        useCache: true,
        priority: 'low', // Low priority for preloading
      });
      
      console.log(`Preloaded ${days} days of historical efficiency data for user ${userId}`);
    } catch (error) {
      console.warn('Failed to preload historical data:', error);
    } finally {
      performanceMonitor.endMeasurement('historical-data-preload');
    }
  }

  /**
   * Get processing statistics
   */
  getProcessingStats(): {
    cacheStats: ReturnType<typeof efficiencyCalculationOptimizer.getCacheStats>;
    performanceMetrics: ReturnType<typeof performanceMonitor.getMetrics>;
  } {
    return {
      cacheStats: efficiencyCalculationOptimizer.getCacheStats(),
      performanceMetrics: performanceMonitor.getMetrics(),
    };
  }
}

// Create singleton instance
export const historicalDataProcessor = new HistoricalDataProcessorClass();