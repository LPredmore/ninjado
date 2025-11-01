import { useState, useEffect, useMemo, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { SupabaseClient } from '@supabase/supabase-js';
import SidebarLayout from '@/components/SidebarLayout';
import RoutineContainer from '@/components/RoutineContainer';
import { Task } from '@/types';
import { useTimeTracking } from '@/contexts/TimeTrackingContext';
import { useQuery } from "@tanstack/react-query";
import RoutineSelector from '@/components/RoutineSelector';
import { useRoutineState } from '@/hooks/useRoutineState';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { toast } from 'sonner';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { queryKeys, queryConfigs, createQueryInvalidationManager } from "@/lib/queryConfig";
import { updateTaskPerformanceMetrics } from '@/lib/taskPerformance';
import LazyEfficiencyBadge from '@/components/LazyEfficiencyBadge';
import { TaskCompletion } from '@/lib/efficiencyUtils';
import { efficiencyCalculationOptimizer } from '@/lib/efficiencyCalculationOptimizer';
import { useRealTimeCalculationFeedback } from '@/lib/realTimeCalculationFeedback';
import { useQueryClient } from '@tanstack/react-query';
import { storageManager } from '@/lib/storageManager';
import { performanceFlowTracker, CRITICAL_FLOWS, FLOW_STEPS, trackFlowStep } from '@/lib/performanceFlowTracker';
import { usePerformanceMeasurement } from '@/lib/performanceMonitor';

interface IndexProps {
  user: User;
  supabase: SupabaseClient;
}

const Index = ({ user, supabase }: IndexProps) => {
  const queryClient = useQueryClient();
  const { totalTimeSaved, recordTaskCompletion } = useTimeTracking();
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(
    () => storageManager.get<string>('selectedRoutineId')
  );
  const [orderedTasks, setOrderedTasks] = useState<Task[]>([]);
  const [taskStartTimes, setTaskStartTimes] = useState<{ [taskId: string]: number }>({});
  const [taskCompletions, setTaskCompletions] = useState<TaskCompletion[]>([]);
  const [currentCalculationId, setCurrentCalculationId] = useState<string | null>(null);
  const [currentFlowId, setCurrentFlowId] = useState<string | null>(null);

  // Track component render performance
  usePerformanceMeasurement('index-page-render');
  
  const {
    isRoutineStarted,
    setIsRoutineStarted,
    isPaused,
    setIsPaused,
    timers,
    setTimers,
    completedTaskIds,
    setCompletedTaskIds,
    lastUpdated,
    resetRoutineState,
    cumulativeTimeSaved,
    setCumulativeTimeSaved,
    cumulativeSpeedTaskDuration,
    setCumulativeSpeedTaskDuration,
  } = useRoutineState(selectedRoutineId);

  // Real-time calculation feedback
  const {
    startTracking,
    updateProgress,
    completeCalculation,
    cleanup: cleanupRealTimeTracking,
  } = useRealTimeCalculationFeedback(
    (update) => {
      // Handle real-time efficiency updates
      if (update.type === 'intermediate' && update.data.estimatedFinalEfficiency !== null) {
        // Could update UI with estimated efficiency here
        console.log(`Estimated efficiency: ${update.data.estimatedFinalEfficiency.toFixed(1)}%`);
      }
    },
    'high'
  );

  const { data: routines } = useQuery({
    queryKey: queryKeys.routines(user.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routines')
        .select('id, title')
        .eq('user_id', user.id);

      if (error) throw error;
      return data;
    },
    ...queryConfigs.routines,
  });

  const { data: tasks } = useQuery({
    queryKey: queryKeys.tasks(selectedRoutineId),
    enabled: !!selectedRoutineId,
    queryFn: async () => {
      if (!selectedRoutineId) return [];
      const { data, error } = await supabase
        .from('routine_tasks')
        .select('*')
        .eq('routine_id', selectedRoutineId)
        .order('position', { ascending: true });

      if (error) throw error;
      return data;
    },
    ...queryConfigs.tasks,
  });


  useEffect(() => {
    if (tasks) {
      setOrderedTasks(tasks);
    }
  }, [tasks]);

  useEffect(() => {
    if (selectedRoutineId) {
      storageManager.set('selectedRoutineId', selectedRoutineId);
    } else {
      storageManager.remove('selectedRoutineId');
    }
  }, [selectedRoutineId]);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase]);

  const handleTaskComplete = useCallback(async (taskId: string, timeSaved: number) => {
    const task = orderedTasks.find(t => t.id === taskId);
    if (!task) return;

    // Track task completion in performance flow
    if (currentFlowId) {
      performanceFlowTracker.addFlowStep(currentFlowId, FLOW_STEPS.TASK_COMPLETE, {
        taskId,
        taskTitle: task.title,
        timeSaved,
      });
    }

    // Calculate actual completion time
    const startTime = taskStartTimes[taskId];
    const currentTime = Date.now();
    const actualDuration = startTime ? Math.round((currentTime - startTime) / 1000) : task.duration * 60;
    
    // Ensure task type defaults to 'regular' if not specified (backward compatibility)
    const taskType = task.type || 'regular';
    
    // Record task completion for new efficiency calculation
    const taskCompletion: TaskCompletion = {
      type: taskType,
      plannedDuration: task.duration * 60, // Convert minutes to seconds
      actualDuration: actualDuration,
    };
    
    setTaskCompletions(prev => [...prev, taskCompletion]);
    setCompletedTaskIds(prev => [...prev, taskId]);
    
    // Update real-time calculation feedback
    if (currentCalculationId) {
      updateProgress(currentCalculationId, taskCompletion);
    }
    
    // Track speed task duration (regular tasks only) - keep for backward compatibility
    if (taskType === 'regular') {
      setCumulativeSpeedTaskDuration(prev => {
        const newTotal = prev + (task.duration * 60);
        if (selectedRoutineId) {
          storageManager.set(`routine-${selectedRoutineId}-speed-duration`, newTotal);
        }
        return newTotal;
      });
    }
    
    // Update cumulative time saved for this routine session
    // Regular tasks: time saved = planned duration - actual duration (can be positive or negative)
    // Focus tasks: only overruns count as penalties (negative time saved)
    // This creates a "time bank" that shows how much ahead or behind the user is
    setCumulativeTimeSaved(prev => {
      const newTotal = prev + timeSaved;
      if (selectedRoutineId) {
        storageManager.set(`routine-${selectedRoutineId}-cumulative-time`, newTotal);
      }
      return newTotal;
    });
    
    await recordTaskCompletion(task.title, timeSaved);
    
    // Update task performance metrics
    await updateTaskPerformanceMetrics(taskId, user.id, timeSaved);

    const updatedCompletedTasks = [...completedTaskIds, taskId];
    const updatedTaskCompletions = [...taskCompletions, taskCompletion];
    
    if (orderedTasks && updatedCompletedTasks.length === orderedTasks.length) {
      // Track efficiency calculation in performance flow
      if (currentFlowId) {
        performanceFlowTracker.addFlowStep(currentFlowId, FLOW_STEPS.EFFICIENCY_CALC, {
          taskCount: orderedTasks.length,
        });
      }
      
      // Complete real-time calculation tracking
      if (currentCalculationId) {
        await completeCalculation(currentCalculationId);
        setCurrentCalculationId(null);
      }
      
      // Calculate efficiency using optimized calculation
      const currentHasRegularTasks = orderedTasks.some(t => (t.type || 'regular') === 'regular');
      const currentSelectedRoutine = routines?.find(routine => routine.id === selectedRoutineId);
      
      if (currentHasRegularTasks && currentSelectedRoutine) {
        const efficiencyResult = await trackFlowStep(
          currentFlowId || 'efficiency-calc-fallback',
          'efficiency-calculation',
          async () => efficiencyCalculationOptimizer.calculateRoutineEfficiencyOptimized(updatedTaskCompletions)
        );
        
        // Calculate backward compatibility values for database storage
        // For regular tasks: time saved = planned - actual
        // For focus tasks: only count overruns as penalties (negative time saved)
        const totalTimeSaved = updatedTaskCompletions.reduce((sum, taskComp) => {
          if (taskComp.type === 'regular') {
            return sum + (taskComp.plannedDuration - taskComp.actualDuration);
          } else if (taskComp.type === 'focus') {
            // Focus tasks: only count overruns as penalties
            const overrun = taskComp.actualDuration - taskComp.plannedDuration;
            return sum - Math.max(0, overrun); // Subtract overrun if positive
          }
          return sum;
        }, 0);
        
        // Total routine duration: sum of actual time for regular tasks + focus task overruns
        const totalRoutineDuration = updatedTaskCompletions.reduce((sum, taskComp) => {
          if (taskComp.type === 'regular') {
            return sum + taskComp.actualDuration;
          } else if (taskComp.type === 'focus') {
            // Focus tasks: only count overruns in total duration
            const overrun = taskComp.actualDuration - taskComp.plannedDuration;
            return sum + Math.max(0, overrun);
          }
          return sum;
        }, 0);
        
        // Convert efficiency to percentage for storage (efficiency is already a ratio)
        const efficiencyPercentage = efficiencyResult.efficiency !== null 
          ? efficiencyResult.efficiency * 100 
          : null;
        
        try {
          const { error } = await supabase
            .from('routine_completions')
            .insert({
              user_id: user.id,
              routine_id: selectedRoutineId,
              routine_title: currentSelectedRoutine.title,
              user_email: user.email || '',
              total_time_saved: totalTimeSaved,
              total_routine_duration: totalRoutineDuration,
              efficiency_percentage: efficiencyPercentage,
              has_regular_tasks: currentHasRegularTasks,
            });
          
          if (error) throw error;
          
          // Invalidate efficiency stats to refresh badge
          const currentInvalidationManager = createQueryInvalidationManager(queryClient);
          currentInvalidationManager.invalidateEfficiencyQueries(user.id);
          
          // Complete performance flow tracking
          if (currentFlowId) {
            performanceFlowTracker.addFlowStep(currentFlowId, FLOW_STEPS.ROUTINE_COMPLETE, {
              efficiencyPercentage,
              totalTimeSaved,
              totalRoutineDuration,
            });
            performanceFlowTracker.completeFlow(currentFlowId, {
              success: true,
              efficiencyPercentage,
            });
            setCurrentFlowId(null);
          }
          
          // Enhanced toast based on efficiency - Updated thresholds for new scoring system
          const efficiencyPercent = efficiencyPercentage || 0;
          
          // Thresholds aligned with new belt system: Grandmaster (85%+), Master (80%+), Expert (75%+), Advanced (70%+)
          if (efficiencyPercent >= 85) {
            toast.success(`🥷 Routine complete! Efficiency: ${efficiencyPercent.toFixed(1)}% - Grandmaster level!`);
          } else if (efficiencyPercent >= 80) {
            toast.success(`🏆 Routine complete! Efficiency: ${efficiencyPercent.toFixed(1)}% - Master level!`);
          } else if (efficiencyPercent >= 75) {
            toast.success(`⚡ Routine complete! Efficiency: ${efficiencyPercent.toFixed(1)}% - Expert level!`);
          } else if (efficiencyPercent >= 60) {
            toast.success(`🎯 Routine complete! Efficiency: ${efficiencyPercent.toFixed(1)}%`);
          } else {
            toast.success(`📈 Routine complete! Efficiency: ${efficiencyPercent.toFixed(1)}%`);
          }
        } catch (error) {
          console.error('Failed to log routine completion:', error);
        }
      } else if (!currentHasRegularTasks && currentSelectedRoutine) {
        // Handle routines with only focus tasks - no efficiency calculation
        try {
          const { error } = await supabase
            .from('routine_completions')
            .insert({
              user_id: user.id,
              routine_id: selectedRoutineId,
              routine_title: currentSelectedRoutine.title,
              user_email: user.email || '',
              total_time_saved: 0,
              total_routine_duration: 0,
              efficiency_percentage: null,
              has_regular_tasks: false,
            });
          
          if (error) throw error;
          
          toast.success(`🧘 Focus routine complete! Great concentration work.`);
        } catch (error) {
          console.error('Failed to log routine completion:', error);
        }
      }
      
      // Reset state including new tracking variables
      setTaskStartTimes({});
      setTaskCompletions([]);
      setCurrentCalculationId(null);
      setCurrentFlowId(null);
      cleanupRealTimeTracking();
      resetRoutineState();
      setSelectedRoutineId(null);
    }
  }, [
    orderedTasks,
    taskStartTimes,
    taskCompletions,
    completedTaskIds,
    setCompletedTaskIds,
    setCumulativeSpeedTaskDuration,
    setCumulativeTimeSaved,
    selectedRoutineId,
    recordTaskCompletion,
    updateTaskPerformanceMetrics,
    user.id,
    user.email,
    routines,
    supabase,
    queryClient,
    resetRoutineState,
    setTaskStartTimes,
    setTaskCompletions,
    setSelectedRoutineId,
    currentFlowId,
    currentCalculationId,
    cleanupRealTimeTracking,
    completeCalculation,
    updateProgress
  ]);

  const handleStartRoutine = useCallback(() => {
    // Track routine start in performance flow
    if (currentFlowId) {
      performanceFlowTracker.addFlowStep(currentFlowId, FLOW_STEPS.ROUTINE_START, {
        taskCount: orderedTasks.length,
        selectedRoutineId,
      });
    }
    
    const initialTimers: { [key: string]: number } = {};
    const initialStartTimes: { [key: string]: number } = {};
    const currentTime = Date.now();
    
    orderedTasks.forEach(task => {
      initialTimers[task.id] = task.duration * 60;
      // Set start time for all tasks to track actual completion time
      initialStartTimes[task.id] = currentTime;
    });
    
    setTimers(initialTimers);
    setTaskStartTimes(initialStartTimes);
    setTaskCompletions([]);
    
    // Start real-time calculation tracking
    const calculationId = `routine-${selectedRoutineId}-${Date.now()}`;
    setCurrentCalculationId(calculationId);
    startTracking(calculationId, []);
    
    setIsRoutineStarted(true);
    setIsPaused(false);
  }, [orderedTasks, selectedRoutineId, setTimers, setIsRoutineStarted, setIsPaused, startTracking, currentFlowId]);

  const handlePauseRoutine = useCallback(() => {
    setIsPaused(!isPaused);
  }, [isPaused, setIsPaused]);

  const handleRoutineSelect = useCallback((routineId: string) => {
    // Track routine selection as part of routine execution flow
    const flowId = performanceFlowTracker.startFlow(CRITICAL_FLOWS.ROUTINE_EXECUTION, {
      routineId,
      userId: user.id,
    });
    setCurrentFlowId(flowId);
    
    performanceFlowTracker.addFlowStep(flowId, FLOW_STEPS.ROUTINE_SELECT, { routineId });
    
    resetRoutineState();
    setTaskStartTimes({});
    setTaskCompletions([]);
    setCurrentCalculationId(null);
    cleanupRealTimeTracking();
    setSelectedRoutineId(routineId);
  }, [resetRoutineState, cleanupRealTimeTracking, user.id]);

  const handleTaskReorder = useCallback((reorderedTasks: Task[]) => {
    setOrderedTasks(reorderedTasks);
  }, []);

  // Memoize processed tasks calculation to prevent unnecessary re-renders
  const processedTasks: Task[] = useMemo(() => {
    return orderedTasks.map((task, index) => ({
      ...task,
      isCompleted: completedTaskIds.includes(task.id),
      isActive: isRoutineStarted && 
                !completedTaskIds.includes(task.id) && 
                completedTaskIds.length === index,
      timeLeft: timers[task.id]
    }));
  }, [orderedTasks, completedTaskIds, isRoutineStarted, timers]);

  // Memoize selected routine lookup
  const selectedRoutine = useMemo(() => {
    return routines?.find(routine => routine.id === selectedRoutineId);
  }, [routines, selectedRoutineId]);

  // Memoize whether current routine has regular tasks for efficiency calculation
  const hasRegularTasks = useMemo(() => {
    return orderedTasks.some(t => (t.type || 'regular') === 'regular');
  }, [orderedTasks]);

  // Memoize query invalidation manager creation
  const invalidationManager = useMemo(() => {
    return createQueryInvalidationManager(queryClient);
  }, [queryClient]);

  return (
    <SidebarLayout onSignOut={handleSignOut} totalTimeSaved={totalTimeSaved} userId={user.id}>
      <div className="space-y-4 md:space-y-6 p-3 md:p-6 max-w-full overflow-hidden">
        
        {/* Efficiency Badge - Hero Display */}
        <LazyEfficiencyBadge userId={user.id} variant="hero" />
        
        {/* Routine Selector - Ninja Scroll Style */}
        <div className="clay-element-with-transition">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
              <span className="clay-element-with-transition w-10 h-10 gradient-clay-primary rounded-xl flex items-center justify-center">
                🎯
              </span>
              Choose Your Mission Scroll
            </h2>
            <RoutineSelector
              routines={routines || []}
              selectedRoutineId={selectedRoutineId}
              onRoutineSelect={handleRoutineSelect}
            />
          </div>
        </div>

        {/* Main Routine Container */}
        {selectedRoutineId && (
          <div className="clay-element-with-transition">
            <RoutineContainer
              routineTitle={selectedRoutine?.title || "Ninja Mission"}
              tasks={processedTasks}
              completedTasks={completedTaskIds.length}
              isRoutineStarted={isRoutineStarted}
              isPaused={isPaused}
              onStartRoutine={handleStartRoutine}
              onPauseRoutine={handlePauseRoutine}
              onTaskComplete={handleTaskComplete}
              onTaskReorder={handleTaskReorder}
              userId={user.id}
              routineStartTime={isRoutineStarted ? lastUpdated : null}
              cumulativeTimeSaved={cumulativeTimeSaved}
            />
          </div>
        )}
        
        {/* Empty State - Encouraging message */}
        {!selectedRoutineId && routines && routines.length === 0 && (
          <div className="clay-element-with-transition text-center p-12">
            <div className="clay-element-with-transition w-20 h-20 gradient-clay-accent rounded-full mx-auto mb-6 flex items-center justify-center glow-jade">
              <span className="text-4xl">🥷</span>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">Welcome to the Dojo, Young Ninja!</h3>
            <p className="text-muted-foreground mb-6">Create your first routine to begin your productivity training.</p>
            <Button variant="clay-jade" size="lg">
              <Settings className="w-5 h-5 mr-2" />
              Create First Routine
            </Button>
          </div>
        )}
        
        {/* PWA Install Prompt */}
        <PWAInstallPrompt />
      </div>
    </SidebarLayout>
  );
};

export default Index;
