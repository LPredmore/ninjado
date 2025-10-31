import { efficiencyCalculationOptimizer } from './efficiencyCalculationOptimizer';
import { TaskCompletion } from './efficiencyUtils';
import { performanceMonitor } from './performanceMonitor';

/**
 * Real-time calculation feedback system for non-blocking efficiency updates
 * Provides progressive calculation updates and optimized efficiency badge updates
 */

export interface CalculationProgress {
  taskIndex: number;
  totalTasks: number;
  currentEfficiency: number | null;
  estimatedFinalEfficiency: number | null;
  progressPercentage: number;
  isComplete: boolean;
}

export interface RealTimeUpdate {
  type: 'progress' | 'intermediate' | 'final';
  data: CalculationProgress;
  timestamp: number;
}

export interface CalculationSubscription {
  id: string;
  callback: (update: RealTimeUpdate) => void;
  priority: 'high' | 'normal' | 'low';
}

class RealTimeCalculationFeedbackClass {
  private subscriptions = new Map<string, CalculationSubscription>();
  private activeCalculations = new Map<string, {
    taskCompletions: TaskCompletion[];
    startTime: number;
    lastUpdate: number;
  }>();
  
  // Configuration
  private readonly UPDATE_THROTTLE_MS = 16; // ~60fps
  private readonly PROGRESS_UPDATE_INTERVAL = 100; // 100ms for progress updates
  private readonly ESTIMATION_THRESHOLD = 3; // Minimum tasks for estimation
  
  // Performance tracking
  private updateQueue: Array<{ subscriptionId: string; update: RealTimeUpdate }> = [];
  private processingQueue = false;

  /**
   * Subscribe to real-time calculation updates
   */
  subscribe(
    callback: (update: RealTimeUpdate) => void,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): string {
    const subscriptionId = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    
    this.subscriptions.set(subscriptionId, {
      id: subscriptionId,
      callback,
      priority,
    });
    
    return subscriptionId;
  }

  /**
   * Unsubscribe from real-time updates
   */
  unsubscribe(subscriptionId: string): void {
    this.subscriptions.delete(subscriptionId);
  }

  /**
   * Start real-time calculation tracking for a routine
   */
  startCalculationTracking(
    calculationId: string,
    initialTasks: TaskCompletion[] = []
  ): void {
    this.activeCalculations.set(calculationId, {
      taskCompletions: [...initialTasks],
      startTime: Date.now(),
      lastUpdate: Date.now(),
    });
    
    // Send initial progress update
    this.sendProgressUpdate(calculationId);
  }

  /**
   * Update calculation with new task completion (non-blocking)
   */
  updateCalculationProgress(
    calculationId: string,
    newTaskCompletion: TaskCompletion
  ): void {
    const calculation = this.activeCalculations.get(calculationId);
    if (!calculation) return;
    
    // Update task completions
    calculation.taskCompletions.push(newTaskCompletion);
    calculation.lastUpdate = Date.now();
    
    // Send non-blocking progress update
    this.scheduleProgressUpdate(calculationId);
  }

  /**
   * Complete calculation and send final update
   */
  async completeCalculation(calculationId: string): Promise<void> {
    const calculation = this.activeCalculations.get(calculationId);
    if (!calculation) return;
    
    performanceMonitor.startMeasurement(`final-calculation-${calculationId}`);
    
    try {
      // Use batched calculation for final result
      const finalResult = await efficiencyCalculationOptimizer.calculateRoutineEfficiencyBatched(
        calculation.taskCompletions,
        'high' // High priority for final calculation
      );
      
      const finalUpdate: RealTimeUpdate = {
        type: 'final',
        data: {
          taskIndex: calculation.taskCompletions.length,
          totalTasks: calculation.taskCompletions.length,
          currentEfficiency: finalResult.efficiency ? finalResult.efficiency * 100 : null,
          estimatedFinalEfficiency: finalResult.efficiency ? finalResult.efficiency * 100 : null,
          progressPercentage: 100,
          isComplete: true,
        },
        timestamp: Date.now(),
      };
      
      this.broadcastUpdate(finalUpdate);
      
    } catch (error) {
      console.error('Error in final calculation:', error);
    } finally {
      performanceMonitor.endMeasurement(`final-calculation-${calculationId}`);
      this.activeCalculations.delete(calculationId);
    }
  }

  /**
   * Schedule non-blocking progress update
   */
  private scheduleProgressUpdate(calculationId: string): void {
    // Use requestAnimationFrame for smooth updates
    requestAnimationFrame(() => {
      this.sendProgressUpdate(calculationId);
    });
  }

  /**
   * Send progress update for a calculation
   */
  private sendProgressUpdate(calculationId: string): void {
    const calculation = this.activeCalculations.get(calculationId);
    if (!calculation) return;
    
    const now = Date.now();
    
    // Throttle updates to prevent excessive rendering
    if (now - calculation.lastUpdate < this.UPDATE_THROTTLE_MS) {
      return;
    }
    
    performanceMonitor.startMeasurement(`progress-update-${calculationId}`);
    
    try {
      const taskCompletions = calculation.taskCompletions;
      const completedTasks = taskCompletions.length;
      
      // Calculate current efficiency if we have enough data
      let currentEfficiency: number | null = null;
      let estimatedFinalEfficiency: number | null = null;
      
      if (completedTasks > 0) {
        // Use optimized calculation for current efficiency
        const currentResult = efficiencyCalculationOptimizer.calculateRoutineEfficiencyOptimized(
          taskCompletions
        );
        currentEfficiency = currentResult.efficiency ? currentResult.efficiency * 100 : null;
        
        // Estimate final efficiency if we have enough data
        if (completedTasks >= this.ESTIMATION_THRESHOLD) {
          estimatedFinalEfficiency = this.estimateFinalEfficiency(taskCompletions);
        }
      }
      
      const progressUpdate: RealTimeUpdate = {
        type: completedTasks === 0 ? 'progress' : 'intermediate',
        data: {
          taskIndex: completedTasks,
          totalTasks: Math.max(completedTasks, 1), // Avoid division by zero
          currentEfficiency,
          estimatedFinalEfficiency,
          progressPercentage: completedTasks === 0 ? 0 : Math.min(95, (completedTasks / Math.max(completedTasks, 1)) * 100),
          isComplete: false,
        },
        timestamp: now,
      };
      
      this.queueUpdate(progressUpdate);
      
    } catch (error) {
      console.error('Error in progress update:', error);
    } finally {
      performanceMonitor.endMeasurement(`progress-update-${calculationId}`);
    }
  }

  /**
   * Estimate final efficiency based on current progress
   */
  private estimateFinalEfficiency(taskCompletions: TaskCompletion[]): number | null {
    if (taskCompletions.length < this.ESTIMATION_THRESHOLD) {
      return null;
    }
    
    // Calculate current efficiency
    const currentResult = efficiencyCalculationOptimizer.calculateRoutineEfficiencyOptimized(
      taskCompletions
    );
    
    if (!currentResult.efficiency) {
      return null;
    }
    
    // Simple estimation: assume current trend continues
    // In a more sophisticated version, this could use machine learning
    // or historical patterns to make better predictions
    
    const currentEfficiencyPercent = currentResult.efficiency * 100;
    
    // Apply a slight regression to the mean (efficiency tends to normalize)
    const regressionFactor = 0.1; // 10% regression toward average
    const averageEfficiency = 65; // Assume average efficiency around 65%
    
    const estimatedEfficiency = currentEfficiencyPercent * (1 - regressionFactor) + 
                               averageEfficiency * regressionFactor;
    
    return estimatedEfficiency;
  }

  /**
   * Queue update for batch processing
   */
  private queueUpdate(update: RealTimeUpdate): void {
    // Add update to queue for all subscriptions
    this.subscriptions.forEach((subscription) => {
      this.updateQueue.push({
        subscriptionId: subscription.id,
        update,
      });
    });
    
    // Process queue if not already processing
    if (!this.processingQueue) {
      this.processUpdateQueue();
    }
  }

  /**
   * Broadcast update to all subscribers
   */
  private broadcastUpdate(update: RealTimeUpdate): void {
    this.subscriptions.forEach((subscription) => {
      try {
        subscription.callback(update);
      } catch (error) {
        console.error(`Error in subscription callback ${subscription.id}:`, error);
      }
    });
  }

  /**
   * Process queued updates in batches
   */
  private async processUpdateQueue(): Promise<void> {
    if (this.processingQueue || this.updateQueue.length === 0) {
      return;
    }
    
    this.processingQueue = true;
    
    try {
      // Group updates by subscription and keep only the latest for each
      const latestUpdates = new Map<string, RealTimeUpdate>();
      
      while (this.updateQueue.length > 0) {
        const queuedUpdate = this.updateQueue.shift();
        if (queuedUpdate) {
          latestUpdates.set(queuedUpdate.subscriptionId, queuedUpdate.update);
        }
      }
      
      // Send latest updates to subscribers
      for (const [subscriptionId, update] of latestUpdates) {
        const subscription = this.subscriptions.get(subscriptionId);
        if (subscription) {
          try {
            subscription.callback(update);
          } catch (error) {
            console.error(`Error in subscription callback ${subscriptionId}:`, error);
          }
        }
      }
      
    } finally {
      this.processingQueue = false;
      
      // If more updates were queued while processing, schedule another batch
      if (this.updateQueue.length > 0) {
        setTimeout(() => this.processUpdateQueue(), this.UPDATE_THROTTLE_MS);
      }
    }
  }

  /**
   * Create optimized efficiency badge updater
   */
  createEfficiencyBadgeUpdater(
    badgeUpdateCallback: (efficiency: number | null, isEstimated: boolean) => void
  ): {
    subscriptionId: string;
    updateEfficiency: (calculationId: string, taskCompletion: TaskCompletion) => void;
    cleanup: () => void;
  } {
    const subscriptionId = this.subscribe((update) => {
      const efficiency = update.data.isComplete 
        ? update.data.currentEfficiency 
        : update.data.estimatedFinalEfficiency;
      
      const isEstimated = !update.data.isComplete && update.data.estimatedFinalEfficiency !== null;
      
      // Only update if we have meaningful data
      if (efficiency !== null) {
        badgeUpdateCallback(efficiency, isEstimated);
      }
    }, 'high');
    
    return {
      subscriptionId,
      updateEfficiency: (calculationId: string, taskCompletion: TaskCompletion) => {
        this.updateCalculationProgress(calculationId, taskCompletion);
      },
      cleanup: () => {
        this.unsubscribe(subscriptionId);
      },
    };
  }

  /**
   * Get active calculations count
   */
  getActiveCalculationsCount(): number {
    return this.activeCalculations.size;
  }

  /**
   * Get subscription count
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Clear all active calculations and subscriptions
   */
  cleanup(): void {
    this.activeCalculations.clear();
    this.subscriptions.clear();
    this.updateQueue = [];
    this.processingQueue = false;
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    activeCalculations: number;
    subscriptions: number;
    queuedUpdates: number;
    isProcessingQueue: boolean;
  } {
    return {
      activeCalculations: this.activeCalculations.size,
      subscriptions: this.subscriptions.size,
      queuedUpdates: this.updateQueue.length,
      isProcessingQueue: this.processingQueue,
    };
  }
}

// Create singleton instance
export const realTimeCalculationFeedback = new RealTimeCalculationFeedbackClass();

/**
 * React hook for real-time calculation updates
 */
export function useRealTimeCalculationFeedback(
  onUpdate: (update: RealTimeUpdate) => void,
  priority: 'high' | 'normal' | 'low' = 'normal'
): {
  subscriptionId: string | null;
  startTracking: (calculationId: string, initialTasks?: TaskCompletion[]) => void;
  updateProgress: (calculationId: string, taskCompletion: TaskCompletion) => void;
  completeCalculation: (calculationId: string) => Promise<void>;
  cleanup: () => void;
} {
  let subscriptionId: string | null = null;
  
  const startTracking = (calculationId: string, initialTasks: TaskCompletion[] = []) => {
    if (!subscriptionId) {
      subscriptionId = realTimeCalculationFeedback.subscribe(onUpdate, priority);
    }
    realTimeCalculationFeedback.startCalculationTracking(calculationId, initialTasks);
  };
  
  const updateProgress = (calculationId: string, taskCompletion: TaskCompletion) => {
    realTimeCalculationFeedback.updateCalculationProgress(calculationId, taskCompletion);
  };
  
  const completeCalculation = async (calculationId: string) => {
    await realTimeCalculationFeedback.completeCalculation(calculationId);
  };
  
  const cleanup = () => {
    if (subscriptionId) {
      realTimeCalculationFeedback.unsubscribe(subscriptionId);
      subscriptionId = null;
    }
  };
  
  return {
    subscriptionId,
    startTracking,
    updateProgress,
    completeCalculation,
    cleanup,
  };
}