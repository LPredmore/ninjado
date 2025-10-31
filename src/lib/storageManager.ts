/**
 * Centralized localStorage management system with batching, cleanup, and quota management
 * Implements requirements 3.1, 3.3, 3.5 from performance optimization spec
 */

interface StorageOperation {
  key: string;
  value: unknown;
  timestamp: number;
}

interface StorageConfig {
  prefix: string;
  maxSize: number; // in bytes
  cleanupThreshold: number; // percentage (0-100)
  batchDelay: number; // milliseconds
}

interface StorageMetrics {
  totalSize: number;
  itemCount: number;
  quotaUsage: number; // percentage
}

class StorageManager {
  private config: StorageConfig;
  private batchQueue: StorageOperation[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly STORAGE_KEY_PREFIX: string;

  constructor(config: Partial<StorageConfig> = {}) {
    this.config = {
      prefix: 'ninja-app',
      maxSize: 5 * 1024 * 1024, // 5MB default
      cleanupThreshold: 80, // 80% usage triggers cleanup
      batchDelay: 100, // 100ms batch delay
      ...config,
    };
    
    this.STORAGE_KEY_PREFIX = `${this.config.prefix}-`;
  }

  /**
   * Get value from localStorage with optional default
   */
  get<T>(key: string, defaultValue?: T): T | null {
    try {
      const fullKey = this.getFullKey(key);
      const item = localStorage.getItem(fullKey);
      
      if (item === null) {
        return defaultValue !== undefined ? defaultValue : null;
      }
      
      return JSON.parse(item) as T;
    } catch (error) {
      console.warn(`StorageManager: Failed to get item "${key}":`, error);
      return defaultValue !== undefined ? defaultValue : null;
    }
  }

  /**
   * Set value in localStorage (batched)
   */
  set<T>(key: string, value: T): void {
    const operation: StorageOperation = {
      key,
      value,
      timestamp: Date.now(),
    };

    this.batchQueue.push(operation);
    this.scheduleBatchWrite();
  }

  /**
   * Remove item from localStorage
   */
  remove(key: string): void {
    try {
      const fullKey = this.getFullKey(key);
      localStorage.removeItem(fullKey);
    } catch (error) {
      console.warn(`StorageManager: Failed to remove item "${key}":`, error);
    }
  }

  /**
   * Batch set multiple items at once
   */
  batchSet(operations: Array<{ key: string; value: unknown }>): void {
    const timestamp = Date.now();
    
    operations.forEach(({ key, value }) => {
      this.batchQueue.push({
        key,
        value,
        timestamp,
      });
    });

    this.scheduleBatchWrite();
  }

  /**
   * Clean up items matching a pattern
   */
  cleanup(pattern: RegExp): number {
    let removedCount = 0;
    
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.STORAGE_KEY_PREFIX)) {
          const shortKey = key.substring(this.STORAGE_KEY_PREFIX.length);
          if (pattern.test(shortKey)) {
            keysToRemove.push(key);
          }
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        removedCount++;
      });
      
    } catch (error) {
      console.warn('StorageManager: Failed to cleanup items:', error);
    }
    
    return removedCount;
  }

  /**
   * Get storage size and usage metrics
   */
  getStorageMetrics(): StorageMetrics {
    let totalSize = 0;
    let itemCount = 0;
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.STORAGE_KEY_PREFIX)) {
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += key.length + value.length;
            itemCount++;
          }
        }
      }
    } catch (error) {
      console.warn('StorageManager: Failed to calculate storage metrics:', error);
    }
    
    const quotaUsage = (totalSize / this.config.maxSize) * 100;
    
    return {
      totalSize,
      itemCount,
      quotaUsage,
    };
  }

  /**
   * Check if cleanup is needed based on quota usage
   */
  isCleanupNeeded(): boolean {
    const metrics = this.getStorageMetrics();
    return metrics.quotaUsage >= this.config.cleanupThreshold;
  }

  /**
   * Perform automatic cleanup of expired items
   */
  performAutoCleanup(): number {
    // Clean up temporary routine state data older than 24 hours
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    let removedCount = 0;
    
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.STORAGE_KEY_PREFIX)) {
          const shortKey = key.substring(this.STORAGE_KEY_PREFIX.length);
          
          // Remove temporary routine state data
          if (shortKey.match(/^routineState_.*/) || shortKey.match(/^routine-.*-temp$/)) {
            try {
              const value = localStorage.getItem(key);
              if (value) {
                const data = JSON.parse(value);
                if (data.lastUpdated && data.lastUpdated < oneDayAgo) {
                  keysToRemove.push(key);
                }
              }
            } catch {
              // If we can't parse it, it's probably corrupted, remove it
              keysToRemove.push(key);
            }
          }
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        removedCount++;
      });
      
    } catch (error) {
      console.warn('StorageManager: Failed to perform auto cleanup:', error);
    }
    
    return removedCount;
  }

  /**
   * Clean up expired routine state data specifically
   */
  cleanupExpiredRoutineData(maxAgeHours: number = 24): number {
    const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
    let removedCount = 0;
    
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.STORAGE_KEY_PREFIX)) {
          const shortKey = key.substring(this.STORAGE_KEY_PREFIX.length);
          
          // Check routine state data
          if (shortKey.match(/^routineState_.*/) || 
              shortKey.match(/^routine-.*-cumulative-time$/) ||
              shortKey.match(/^routine-.*-speed-duration$/)) {
            try {
              const value = localStorage.getItem(key);
              if (value) {
                // For routine state, check lastUpdated timestamp
                if (shortKey.startsWith('routineState_')) {
                  const data = JSON.parse(value);
                  if (data.lastUpdated && data.lastUpdated < cutoffTime) {
                    keysToRemove.push(key);
                  }
                } else {
                  // For cumulative data, remove if no corresponding routine state exists
                  const routineId = shortKey.match(/^routine-(.*?)-(cumulative-time|speed-duration)$/)?.[1];
                  if (routineId) {
                    const stateKey = this.getFullKey(`routineState_${routineId}`);
                    if (!localStorage.getItem(stateKey)) {
                      keysToRemove.push(key);
                    }
                  }
                }
              }
            } catch {
              // If we can't parse it, it's probably corrupted, remove it
              keysToRemove.push(key);
            }
          }
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        removedCount++;
      });
      
    } catch (error) {
      console.warn('StorageManager: Failed to cleanup expired routine data:', error);
    }
    
    return removedCount;
  }

  /**
   * Clear all items managed by this storage manager
   */
  clear(): void {
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.STORAGE_KEY_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
      
    } catch (error) {
      console.warn('StorageManager: Failed to clear storage:', error);
    }
  }

  /**
   * Get all keys managed by this storage manager
   */
  getAllKeys(): string[] {
    const keys: string[] = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.STORAGE_KEY_PREFIX)) {
          keys.push(key.substring(this.STORAGE_KEY_PREFIX.length));
        }
      }
    } catch (error) {
      console.warn('StorageManager: Failed to get all keys:', error);
    }
    
    return keys;
  }

  /**
   * Private method to get full key with prefix
   */
  private getFullKey(key: string): string {
    return `${this.STORAGE_KEY_PREFIX}${key}`;
  }

  /**
   * Private method to schedule batch write operation
   */
  private scheduleBatchWrite(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(() => {
      this.executeBatchWrite();
    }, this.config.batchDelay);
  }

  /**
   * Private method to execute batched write operations
   */
  private executeBatchWrite(): void {
    if (this.batchQueue.length === 0) return;

    const operations = [...this.batchQueue];
    this.batchQueue = [];
    this.batchTimeout = null;

    // Check if cleanup is needed before writing
    if (this.isCleanupNeeded()) {
      const removedCount = this.performAutoCleanup();
      if (removedCount > 0) {
        console.log(`StorageManager: Auto-cleanup removed ${removedCount} expired items`);
      }
    }

    // Group operations by key to avoid duplicate writes
    const operationMap = new Map<string, StorageOperation>();
    operations.forEach(op => {
      operationMap.set(op.key, op);
    });

    // Execute the writes
    operationMap.forEach((operation, key) => {
      try {
        const fullKey = this.getFullKey(key);
        const serializedValue = JSON.stringify(operation.value);
        
        // Check if this single item would exceed quota
        const itemSize = fullKey.length + serializedValue.length;
        if (itemSize > this.config.maxSize * 0.1) { // Single item shouldn't be more than 10% of quota
          console.warn(`StorageManager: Item "${key}" is too large (${itemSize} bytes), skipping`);
          return;
        }
        
        localStorage.setItem(fullKey, serializedValue);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          console.warn(`StorageManager: Quota exceeded, attempting cleanup and retry for "${key}"`);
          
          // Try cleanup and retry once
          const removedCount = this.performAutoCleanup();
          if (removedCount > 0) {
            try {
              const fullKey = this.getFullKey(key);
              localStorage.setItem(fullKey, JSON.stringify(operation.value));
            } catch (retryError) {
              console.error(`StorageManager: Failed to store "${key}" even after cleanup:`, retryError);
            }
          }
        } else {
          console.error(`StorageManager: Failed to store "${key}":`, error);
        }
      }
    });
  }
}

// Create and export singleton instance
export const storageManager = new StorageManager();

// Export class for custom instances if needed
export { StorageManager };
export type { StorageConfig, StorageMetrics };