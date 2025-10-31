/**
 * Centralized Timer Management System
 * 
 * Consolidates all timer operations into a single efficient system to:
 * - Reduce memory usage by using a single interval for all timers
 * - Prevent memory leaks through proper cleanup
 * - Optimize performance by batching timer updates
 * - Provide consistent timer behavior across the application
 */

export interface TimerConfig {
  id: string;
  duration: number; // in seconds
  onTick?: (timeLeft: number) => void;
  onComplete?: () => void;
  autoStart?: boolean;
}

export interface TimerState {
  id: string;
  timeLeft: number;
  isActive: boolean;
  isPaused: boolean;
  startTime: number;
  lastUpdateTime: number;
}

export class TimerManager {
  private static instance: TimerManager | null = null;
  private timers: Map<string, TimerState> = new Map();
  private callbacks: Map<string, { onTick?: (timeLeft: number) => void; onComplete?: () => void }> = new Map();
  private masterInterval: NodeJS.Timeout | null = null;
  private readonly TICK_INTERVAL = 1000; // 1 second
  private isRunning = false;

  private constructor() {
    // Private constructor for singleton pattern
    this.setupVisibilityChangeHandler();
  }

  /**
   * Get the singleton instance of TimerManager
   */
  public static getInstance(): TimerManager {
    if (!TimerManager.instance) {
      TimerManager.instance = new TimerManager();
    }
    return TimerManager.instance;
  }

  /**
   * Create a new timer with the specified configuration
   */
  public createTimer(config: TimerConfig): void {
    const { id, duration, onTick, onComplete, autoStart = false } = config;

    // Remove existing timer if it exists
    this.removeTimer(id);

    const now = Date.now();
    const timerState: TimerState = {
      id,
      timeLeft: duration,
      isActive: autoStart,
      isPaused: false,
      startTime: now,
      lastUpdateTime: now,
    };

    this.timers.set(id, timerState);
    this.callbacks.set(id, { onTick, onComplete });

    if (autoStart) {
      this.startMasterInterval();
    }
  }

  /**
   * Start a specific timer
   */
  public startTimer(id: string): boolean {
    const timer = this.timers.get(id);
    if (!timer) {
      console.warn(`Timer with id "${id}" not found`);
      return false;
    }

    timer.isActive = true;
    timer.isPaused = false;
    timer.lastUpdateTime = Date.now();
    
    this.startMasterInterval();
    return true;
  }

  /**
   * Pause a specific timer
   */
  public pauseTimer(id: string): boolean {
    const timer = this.timers.get(id);
    if (!timer) {
      console.warn(`Timer with id "${id}" not found`);
      return false;
    }

    timer.isPaused = true;
    timer.lastUpdateTime = Date.now();
    
    // Stop master interval if no active timers
    if (!this.hasActiveTimers()) {
      this.stopMasterInterval();
    }
    
    return true;
  }

  /**
   * Resume a paused timer
   */
  public resumeTimer(id: string): boolean {
    const timer = this.timers.get(id);
    if (!timer) {
      console.warn(`Timer with id "${id}" not found`);
      return false;
    }

    timer.isPaused = false;
    timer.lastUpdateTime = Date.now();
    
    if (timer.isActive) {
      this.startMasterInterval();
    }
    
    return true;
  }

  /**
   * Stop a timer (different from pause - stops completely)
   */
  public stopTimer(id: string): boolean {
    const timer = this.timers.get(id);
    if (!timer) {
      console.warn(`Timer with id "${id}" not found`);
      return false;
    }

    timer.isActive = false;
    timer.isPaused = false;
    
    // Stop master interval if no active timers
    if (!this.hasActiveTimers()) {
      this.stopMasterInterval();
    }
    
    return true;
  }

  /**
   * Remove a timer completely
   */
  public removeTimer(id: string): boolean {
    const existed = this.timers.has(id);
    this.timers.delete(id);
    this.callbacks.delete(id);
    
    // Stop master interval if no active timers
    if (!this.hasActiveTimers()) {
      this.stopMasterInterval();
    }
    
    return existed;
  }

  /**
   * Get the current state of a timer
   */
  public getTimerState(id: string): TimerState | null {
    return this.timers.get(id) || null;
  }

  /**
   * Get all active timer IDs
   */
  public getActiveTimers(): string[] {
    return Array.from(this.timers.entries())
      .filter(([, timer]) => timer.isActive && !timer.isPaused)
      .map(([id]) => id);
  }

  /**
   * Batch update multiple timers (useful for routine state management)
   */
  public batchUpdateTimers(updates: Array<{ id: string; timeLeft: number }>): void {
    const now = Date.now();
    
    updates.forEach(({ id, timeLeft }) => {
      const timer = this.timers.get(id);
      if (timer) {
        timer.timeLeft = timeLeft;
        timer.lastUpdateTime = now;
      }
    });
  }

  /**
   * Pause all active timers
   */
  public pauseAllTimers(): void {
    this.timers.forEach((timer) => {
      if (timer.isActive) {
        timer.isPaused = true;
        timer.lastUpdateTime = Date.now();
      }
    });
    
    this.stopMasterInterval();
  }

  /**
   * Resume all paused timers
   */
  public resumeAllTimers(): void {
    const now = Date.now();
    let hasActiveTimers = false;
    
    this.timers.forEach((timer) => {
      if (timer.isActive && timer.isPaused) {
        timer.isPaused = false;
        timer.lastUpdateTime = now;
        hasActiveTimers = true;
      }
    });
    
    if (hasActiveTimers) {
      this.startMasterInterval();
    }
  }

  /**
   * Clean up all timers and stop the master interval
   */
  public cleanup(): void {
    this.stopMasterInterval();
    this.timers.clear();
    this.callbacks.clear();
  }

  /**
   * Handle visibility changes to maintain timer accuracy
   */
  private setupVisibilityChangeHandler(): void {
    if (typeof document !== 'undefined') {
      let lastVisibilityChange = Date.now();
      
      document.addEventListener('visibilitychange', () => {
        const now = Date.now();
        
        if (document.visibilityState === 'hidden') {
          // App going to background - record timestamp
          lastVisibilityChange = now;
          this.pauseBackgroundTimers();
        } else if (document.visibilityState === 'visible') {
          // App coming back to foreground - sync timers efficiently
          const backgroundDuration = now - lastVisibilityChange;
          this.handleVisibilityRestore(backgroundDuration);
        }
      });
    }
  }

  /**
   * Pause timers when app goes to background to prevent unnecessary processing
   */
  private pauseBackgroundTimers(): void {
    // Mark all active timers as backgrounded but don't change their state
    // This prevents the master interval from running unnecessarily
    this.timers.forEach((timer) => {
      if (timer.isActive && !timer.isPaused) {
        timer.lastUpdateTime = Date.now();
      }
    });
  }

  /**
   * Handle app coming back into focus - sync timers with elapsed time efficiently
   */
  private handleVisibilityRestore(backgroundDuration: number): void {
    const now = Date.now();
    const elapsedSeconds = Math.floor(backgroundDuration / 1000);
    
    // Only process if significant time has passed (> 1 second)
    if (elapsedSeconds <= 0) {
      return;
    }

    // Batch process all timer updates to minimize re-renders
    const timerUpdates: Array<{ id: string; timeLeft: number; completed: boolean }> = [];
    
    this.timers.forEach((timer, id) => {
      if (timer.isActive && !timer.isPaused) {
        const newTimeLeft = Math.max(timer.timeLeft - elapsedSeconds, -999);
        timer.timeLeft = newTimeLeft;
        timer.lastUpdateTime = now;
        
        timerUpdates.push({
          id,
          timeLeft: newTimeLeft,
          completed: newTimeLeft <= 0
        });
      }
    });

    // Process all updates in a single batch to minimize callback overhead
    timerUpdates.forEach(({ id, timeLeft, completed }) => {
      const callbacks = this.callbacks.get(id);
      
      // Trigger onTick callback with updated time
      if (callbacks?.onTick) {
        callbacks.onTick(timeLeft);
      }
      
      // Check if timer completed while away
      if (completed && callbacks?.onComplete) {
        callbacks.onComplete();
      }
    });

    // Restart master interval if we have active timers
    if (this.hasActiveTimers() && !this.isRunning) {
      this.startMasterInterval();
    }
  }

  /**
   * Start the master interval if not already running
   */
  private startMasterInterval(): void {
    if (!this.masterInterval && this.hasActiveTimers()) {
      this.isRunning = true;
      this.masterInterval = setInterval(() => {
        this.tickAllTimers();
      }, this.TICK_INTERVAL);
    }
  }

  /**
   * Stop the master interval
   */
  private stopMasterInterval(): void {
    if (this.masterInterval) {
      clearInterval(this.masterInterval);
      this.masterInterval = null;
      this.isRunning = false;
    }
  }

  /**
   * Check if there are any active (non-paused) timers
   */
  private hasActiveTimers(): boolean {
    return Array.from(this.timers.values()).some(
      timer => timer.isActive && !timer.isPaused
    );
  }

  /**
   * Tick all active timers
   */
  private tickAllTimers(): void {
    const now = Date.now();
    const completedTimers: string[] = [];
    
    this.timers.forEach((timer, id) => {
      if (timer.isActive && !timer.isPaused) {
        timer.timeLeft = Math.max(timer.timeLeft - 1, -999);
        timer.lastUpdateTime = now;
        
        const callbacks = this.callbacks.get(id);
        
        // Trigger onTick callback
        if (callbacks?.onTick) {
          callbacks.onTick(timer.timeLeft);
        }
        
        // Check if timer completed
        if (timer.timeLeft <= 0 && callbacks?.onComplete) {
          completedTimers.push(id);
        }
      }
    });
    
    // Handle completed timers after iteration to avoid modifying during iteration
    completedTimers.forEach(id => {
      const callbacks = this.callbacks.get(id);
      if (callbacks?.onComplete) {
        callbacks.onComplete();
      }
    });
    
    // Stop master interval if no more active timers
    if (!this.hasActiveTimers()) {
      this.stopMasterInterval();
    }
  }
}

// Export singleton instance
export const timerManager = TimerManager.getInstance();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    timerManager.cleanup();
  });
}