/**
 * Intelligent Storage Update Scheduler
 * 
 * Optimizes localStorage write operations by:
 * - Batching multiple updates together
 * - Scheduling writes based on user activity patterns
 * - Reducing write frequency during active usage
 * - Prioritizing critical state changes
 */

interface StorageUpdate {
  key: string;
  value: unknown;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
}

interface ActivityMetrics {
  lastUserInteraction: number;
  isUserActive: boolean;
  interactionCount: number;
  averageInteractionInterval: number;
}

export class IntelligentStorageScheduler {
  private static instance: IntelligentStorageScheduler | null = null;
  private pendingUpdates = new Map<string, StorageUpdate>();
  private batchTimeout: NodeJS.Timeout | null = null;
  private activityMetrics: ActivityMetrics = {
    lastUserInteraction: Date.now(),
    isUserActive: true,
    interactionCount: 0,
    averageInteractionInterval: 5000, // Default 5s
  };

  // Configuration
  private readonly BATCH_DELAYS = {
    critical: 50,    // 50ms for critical updates
    high: 200,       // 200ms for high priority
    medium: 1000,    // 1s for medium priority
    low: 3000,       // 3s for low priority
  };

  private readonly ACTIVITY_THRESHOLD = 10000; // 10s of inactivity
  private readonly MAX_BATCH_SIZE = 20;
  private readonly INTERACTION_EVENTS = ['click', 'keydown', 'touchstart', 'scroll'];

  private constructor() {
    this.setupActivityTracking();
    this.setupVisibilityHandling();
  }

  public static getInstance(): IntelligentStorageScheduler {
    if (!IntelligentStorageScheduler.instance) {
      IntelligentStorageScheduler.instance = new IntelligentStorageScheduler();
    }
    return IntelligentStorageScheduler.instance;
  }

  /**
   * Schedule a storage update with intelligent batching
   */
  public scheduleUpdate(
    key: string, 
    value: unknown, 
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): void {
    const update: StorageUpdate = {
      key,
      value,
      priority,
      timestamp: Date.now(),
    };

    // Store the update (overwrites previous update for same key)
    this.pendingUpdates.set(key, update);

    // Schedule batch processing based on priority and activity
    this.scheduleBatchProcess(priority);
  }

  /**
   * Force immediate execution of all pending updates
   */
  public flushUpdates(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    this.processBatch();
  }

  /**
   * Get current activity metrics for external use
   */
  public getActivityMetrics(): ActivityMetrics {
    return { ...this.activityMetrics };
  }

  /**
   * Setup user activity tracking
   */
  private setupActivityTracking(): void {
    if (typeof window === 'undefined') return;

    let lastInteractionTime = Date.now();
    let interactionTimes: number[] = [];

    const handleUserActivity = () => {
      const now = Date.now();
      const timeSinceLastInteraction = now - lastInteractionTime;
      
      // Update metrics
      this.activityMetrics.lastUserInteraction = now;
      this.activityMetrics.isUserActive = true;
      this.activityMetrics.interactionCount++;
      
      // Track interaction intervals for pattern analysis
      if (interactionTimes.length > 0) {
        interactionTimes.push(timeSinceLastInteraction);
        
        // Keep only recent interactions (last 10)
        if (interactionTimes.length > 10) {
          interactionTimes = interactionTimes.slice(-10);
        }
        
        // Calculate average interaction interval
        this.activityMetrics.averageInteractionInterval = 
          interactionTimes.reduce((sum, interval) => sum + interval, 0) / interactionTimes.length;
      }
      
      lastInteractionTime = now;
    };

    // Add activity listeners
    this.INTERACTION_EVENTS.forEach(event => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Check for inactivity periodically
    setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - this.activityMetrics.lastUserInteraction;
      this.activityMetrics.isUserActive = timeSinceLastActivity < this.ACTIVITY_THRESHOLD;
    }, 5000);
  }

  /**
   * Setup visibility change handling for immediate saves
   */
  private setupVisibilityHandling(): void {
    if (typeof document === 'undefined') return;

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        // App going to background - flush all pending updates immediately
        this.flushUpdates();
      }
    });

    // Also flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flushUpdates();
    });
  }

  /**
   * Schedule batch processing based on priority and user activity
   */
  private scheduleBatchProcess(priority: 'low' | 'medium' | 'high' | 'critical'): void {
    // Clear existing timeout
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    // Determine delay based on priority and activity
    let delay = this.BATCH_DELAYS[priority];

    // Adjust delay based on user activity
    if (!this.activityMetrics.isUserActive) {
      // User is inactive - can process more frequently
      delay = Math.min(delay, 500);
    } else if (this.activityMetrics.averageInteractionInterval < 2000) {
      // High activity - delay longer to batch more updates
      delay = Math.max(delay, delay * 1.5);
    }

    // Critical updates always process quickly
    if (priority === 'critical') {
      delay = this.BATCH_DELAYS.critical;
    }

    // Process immediately if we have too many pending updates
    if (this.pendingUpdates.size >= this.MAX_BATCH_SIZE) {
      delay = 0;
    }

    this.batchTimeout = setTimeout(() => {
      this.processBatch();
      this.batchTimeout = null;
    }, delay);
  }

  /**
   * Process all pending updates in a batch
   */
  private processBatch(): void {
    if (this.pendingUpdates.size === 0) {
      return;
    }

    // Convert updates to batch format
    const batchOperations = Array.from(this.pendingUpdates.values()).map(update => ({
      key: update.key,
      value: update.value,
    }));

    try {
      // Use the existing storage manager for batched writes
      const { storageManager } = require('@/lib/storageManager');
      storageManager.batchSet(batchOperations);
      
      // Clear processed updates
      this.pendingUpdates.clear();
      
      // Log performance metrics in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[StorageScheduler] Processed batch of ${batchOperations.length} updates`);
      }
    } catch (error) {
      console.error('[StorageScheduler] Failed to process batch:', error);
      
      // Retry critical updates individually
      const criticalUpdates = Array.from(this.pendingUpdates.values())
        .filter(update => update.priority === 'critical');
      
      criticalUpdates.forEach(update => {
        try {
          localStorage.setItem(update.key, JSON.stringify(update.value));
        } catch (retryError) {
          console.error(`[StorageScheduler] Failed to save critical update for ${update.key}:`, retryError);
        }
      });
      
      this.pendingUpdates.clear();
    }
  }
}

// Export singleton instance
export const intelligentStorageScheduler = IntelligentStorageScheduler.getInstance();