import { performanceMonitor, measureAsync, measureSync } from './performanceMonitor';
import { performanceCollector } from './performanceCollector';

/**
 * Performance flow tracker for monitoring critical user flows
 * Tracks complete user journeys and identifies performance bottlenecks
 */

export interface FlowStep {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface UserFlow {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  totalDuration?: number;
  steps: FlowStep[];
  status: 'active' | 'completed' | 'failed';
  metadata?: Record<string, any>;
}

export interface FlowMetrics {
  flowName: string;
  averageDuration: number;
  completionRate: number;
  bottleneckSteps: string[];
  totalFlows: number;
  failedFlows: number;
}

class PerformanceFlowTrackerClass {
  private activeFlows = new Map<string, UserFlow>();
  private completedFlows: UserFlow[] = [];
  private readonly MAX_COMPLETED_FLOWS = 100;

  /**
   * Start tracking a user flow
   */
  startFlow(flowName: string, metadata?: Record<string, any>): string {
    const flowId = `${flowName}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const startTime = performance.now();

    const flow: UserFlow = {
      id: flowId,
      name: flowName,
      startTime,
      steps: [],
      status: 'active',
      metadata,
    };

    this.activeFlows.set(flowId, flow);
    
    // Start performance measurement for the flow
    performanceMonitor.startMeasurement(`flow-${flowName}`);
    
    console.log(`🎯 Started tracking flow: ${flowName} (${flowId})`);
    
    return flowId;
  }

  /**
   * Add a step to an active flow
   */
  addFlowStep(flowId: string, stepName: string, metadata?: Record<string, any>): void {
    const flow = this.activeFlows.get(flowId);
    if (!flow) {
      console.warn(`Flow ${flowId} not found`);
      return;
    }

    const currentTime = performance.now();
    
    // Complete previous step if exists
    if (flow.steps.length > 0) {
      const lastStep = flow.steps[flow.steps.length - 1];
      if (!lastStep.endTime) {
        lastStep.endTime = currentTime;
        lastStep.duration = lastStep.endTime - lastStep.startTime;
      }
    }

    // Add new step
    const step: FlowStep = {
      name: stepName,
      startTime: currentTime,
      metadata,
    };

    flow.steps.push(step);
    
    // Start measurement for this step
    performanceMonitor.startMeasurement(`flow-${flow.name}-step-${stepName}`);
    
    console.log(`📍 Flow ${flow.name}: Step ${stepName} started`);
  }

  /**
   * Complete a flow
   */
  completeFlow(flowId: string, metadata?: Record<string, any>): UserFlow | null {
    const flow = this.activeFlows.get(flowId);
    if (!flow) {
      console.warn(`Flow ${flowId} not found`);
      return null;
    }

    const endTime = performance.now();
    
    // Complete last step if exists
    if (flow.steps.length > 0) {
      const lastStep = flow.steps[flow.steps.length - 1];
      if (!lastStep.endTime) {
        lastStep.endTime = endTime;
        lastStep.duration = lastStep.endTime - lastStep.startTime;
        
        // End measurement for last step
        performanceMonitor.endMeasurement(`flow-${flow.name}-step-${lastStep.name}`);
      }
    }

    // Complete flow
    flow.endTime = endTime;
    flow.totalDuration = endTime - flow.startTime;
    flow.status = 'completed';
    
    if (metadata) {
      flow.metadata = { ...flow.metadata, ...metadata };
    }

    // End flow measurement
    const flowDuration = performanceMonitor.endMeasurement(`flow-${flow.name}`);
    
    // Move to completed flows
    this.activeFlows.delete(flowId);
    this.completedFlows.push(flow);
    
    // Keep only recent completed flows
    if (this.completedFlows.length > this.MAX_COMPLETED_FLOWS) {
      this.completedFlows = this.completedFlows.slice(-this.MAX_COMPLETED_FLOWS);
    }

    console.log(`✅ Flow ${flow.name} completed in ${flowDuration.toFixed(2)}ms`);
    
    // Check for performance issues
    this.analyzeFlowPerformance(flow);
    
    return flow;
  }

  /**
   * Fail a flow
   */
  failFlow(flowId: string, error: string, metadata?: Record<string, any>): UserFlow | null {
    const flow = this.activeFlows.get(flowId);
    if (!flow) {
      console.warn(`Flow ${flowId} not found`);
      return null;
    }

    const endTime = performance.now();
    
    flow.endTime = endTime;
    flow.totalDuration = endTime - flow.startTime;
    flow.status = 'failed';
    flow.metadata = { 
      ...flow.metadata, 
      ...metadata, 
      error 
    };

    // End measurements
    performanceMonitor.endMeasurement(`flow-${flow.name}`);
    
    // Move to completed flows
    this.activeFlows.delete(flowId);
    this.completedFlows.push(flow);
    
    console.error(`❌ Flow ${flow.name} failed: ${error}`);
    
    return flow;
  }

  /**
   * Get metrics for a specific flow type
   */
  getFlowMetrics(flowName: string): FlowMetrics {
    const flows = this.completedFlows.filter(f => f.name === flowName);
    const completedFlows = flows.filter(f => f.status === 'completed');
    const failedFlows = flows.filter(f => f.status === 'failed');

    const totalDurations = completedFlows
      .map(f => f.totalDuration!)
      .filter(d => d > 0);

    const averageDuration = totalDurations.length > 0
      ? totalDurations.reduce((sum, d) => sum + d, 0) / totalDurations.length
      : 0;

    const completionRate = flows.length > 0
      ? (completedFlows.length / flows.length) * 100
      : 0;

    // Find bottleneck steps (steps that take longer than average)
    const allSteps = completedFlows.flatMap(f => f.steps);
    const stepDurations = new Map<string, number[]>();
    
    allSteps.forEach(step => {
      if (step.duration) {
        const durations = stepDurations.get(step.name) || [];
        durations.push(step.duration);
        stepDurations.set(step.name, durations);
      }
    });

    const bottleneckSteps: string[] = [];
    stepDurations.forEach((durations, stepName) => {
      const avgStepDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      // Consider a step a bottleneck if it takes more than 100ms on average
      if (avgStepDuration > 100) {
        bottleneckSteps.push(stepName);
      }
    });

    return {
      flowName,
      averageDuration,
      completionRate,
      bottleneckSteps,
      totalFlows: flows.length,
      failedFlows: failedFlows.length,
    };
  }

  /**
   * Get all flow metrics
   */
  getAllFlowMetrics(): FlowMetrics[] {
    const flowNames = [...new Set(this.completedFlows.map(f => f.name))];
    return flowNames.map(name => this.getFlowMetrics(name));
  }

  /**
   * Analyze flow performance and log issues
   */
  private analyzeFlowPerformance(flow: UserFlow): void {
    if (!flow.totalDuration) return;

    const issues: string[] = [];

    // Check total flow duration
    if (flow.totalDuration > 5000) { // 5 seconds
      issues.push(`Flow took ${(flow.totalDuration / 1000).toFixed(2)}s (> 5s threshold)`);
    }

    // Check step durations
    flow.steps.forEach(step => {
      if (step.duration && step.duration > 1000) { // 1 second
        issues.push(`Step "${step.name}" took ${step.duration.toFixed(2)}ms (> 1s threshold)`);
      }
    });

    if (issues.length > 0) {
      console.warn(`⚠️ Performance issues in flow ${flow.name}:`, issues);
    }
  }

  /**
   * Get active flows
   */
  getActiveFlows(): UserFlow[] {
    return Array.from(this.activeFlows.values());
  }

  /**
   * Get completed flows
   */
  getCompletedFlows(): UserFlow[] {
    return [...this.completedFlows];
  }

  /**
   * Clear all flow data
   */
  clear(): void {
    this.activeFlows.clear();
    this.completedFlows = [];
  }

  /**
   * Export flow data for analysis
   */
  exportFlowData(): {
    activeFlows: UserFlow[];
    completedFlows: UserFlow[];
    metrics: FlowMetrics[];
  } {
    return {
      activeFlows: this.getActiveFlows(),
      completedFlows: this.getCompletedFlows(),
      metrics: this.getAllFlowMetrics(),
    };
  }
}

// Create singleton instance
export const performanceFlowTracker = new PerformanceFlowTrackerClass();

/**
 * Higher-order function to track async operations as flow steps
 */
export function trackFlowStep<T>(
  flowId: string,
  stepName: string,
  operation: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  return measureAsync(`flow-step-${stepName}`, async () => {
    performanceFlowTracker.addFlowStep(flowId, stepName, metadata);
    
    try {
      const result = await operation();
      return result;
    } catch (error) {
      performanceFlowTracker.failFlow(flowId, `Step ${stepName} failed: ${error}`);
      throw error;
    }
  });
}

/**
 * Higher-order function to track sync operations as flow steps
 */
export function trackFlowStepSync<T>(
  flowId: string,
  stepName: string,
  operation: () => T,
  metadata?: Record<string, any>
): T {
  return measureSync(`flow-step-${stepName}`, () => {
    performanceFlowTracker.addFlowStep(flowId, stepName, metadata);
    
    try {
      const result = operation();
      return result;
    } catch (error) {
      performanceFlowTracker.failFlow(flowId, `Step ${stepName} failed: ${error}`);
      throw error;
    }
  });
}

/**
 * Predefined critical user flows
 */
export const CRITICAL_FLOWS = {
  ROUTINE_EXECUTION: 'routine-execution',
  ROUTINE_CREATION: 'routine-creation',
  TASK_COMPLETION: 'task-completion',
  EFFICIENCY_CALCULATION: 'efficiency-calculation',
  APP_STARTUP: 'app-startup',
  NAVIGATION: 'navigation',
} as const;

/**
 * Flow step names for consistency
 */
export const FLOW_STEPS = {
  // App startup
  APP_INIT: 'app-initialization',
  AUTH_CHECK: 'authentication-check',
  DATA_LOAD: 'initial-data-load',
  UI_RENDER: 'ui-render',
  
  // Routine execution
  ROUTINE_SELECT: 'routine-selection',
  ROUTINE_START: 'routine-start',
  TASK_START: 'task-start',
  TASK_COMPLETE: 'task-completion',
  EFFICIENCY_CALC: 'efficiency-calculation',
  ROUTINE_COMPLETE: 'routine-completion',
  
  // Routine creation
  ROUTINE_CREATE_INIT: 'routine-create-init',
  TASK_ADD: 'task-add',
  ROUTINE_SAVE: 'routine-save',
  
  // Navigation
  PAGE_LOAD: 'page-load',
  COMPONENT_MOUNT: 'component-mount',
  DATA_FETCH: 'data-fetch',
} as const;