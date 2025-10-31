import { useState, useEffect } from 'react';
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
import { queryKeys } from "@/lib/queryKeys";
import { updateTaskPerformanceMetrics } from '@/lib/taskPerformance';
import { EfficiencyBadge } from '@/components/EfficiencyBadge';
import { calculateEfficiencyPercentage, calculateRoutineEfficiency, TaskCompletion } from '@/lib/efficiencyUtils';
import { useQueryClient } from '@tanstack/react-query';

interface IndexProps {
  user: User;
  supabase: SupabaseClient;
}

const Index = ({ user, supabase }: IndexProps) => {
  const queryClient = useQueryClient();
  const { totalTimeSaved, recordTaskCompletion } = useTimeTracking();
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(
    () => localStorage.getItem('selectedRoutineId')
  );
  const [orderedTasks, setOrderedTasks] = useState<Task[]>([]);
  const [taskStartTimes, setTaskStartTimes] = useState<{ [taskId: string]: number }>({});
  const [taskCompletions, setTaskCompletions] = useState<TaskCompletion[]>([]);
  
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
  });


  useEffect(() => {
    if (tasks) {
      setOrderedTasks(tasks);
    }
  }, [tasks]);

  useEffect(() => {
    if (selectedRoutineId) {
      localStorage.setItem('selectedRoutineId', selectedRoutineId);
    } else {
      localStorage.removeItem('selectedRoutineId');
    }
  }, [selectedRoutineId]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleTaskComplete = async (taskId: string, timeSaved: number) => {
    const task = orderedTasks.find(t => t.id === taskId);
    if (!task) return;

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
    
    // Track speed task duration (regular tasks only) - keep for backward compatibility
    if (taskType === 'regular') {
      setCumulativeSpeedTaskDuration(prev => {
        const newTotal = prev + (task.duration * 60);
        if (selectedRoutineId) {
          localStorage.setItem(`routine-${selectedRoutineId}-speed-duration`, newTotal.toString());
        }
        return newTotal;
      });
    }
    
    // Update cumulative time saved for this routine session - keep for backward compatibility
    // Note: For focus tasks that go over time, this will be negative (penalty)
    setCumulativeTimeSaved(prev => {
      const newTotal = prev + timeSaved;
      if (selectedRoutineId) {
        localStorage.setItem(`routine-${selectedRoutineId}-cumulative-time`, newTotal.toString());
      }
      return newTotal;
    });
    
    await recordTaskCompletion(task.title, timeSaved);
    
    // Update task performance metrics
    await updateTaskPerformanceMetrics(taskId, user.id, timeSaved);

    const updatedCompletedTasks = [...completedTaskIds, taskId];
    const updatedTaskCompletions = [...taskCompletions, taskCompletion];
    
    if (orderedTasks && updatedCompletedTasks.length === orderedTasks.length) {
      // Calculate efficiency using new ratio-based formula
      const hasRegularTasks = orderedTasks.some(t => (t.type || 'regular') === 'regular');
      
      if (hasRegularTasks && selectedRoutine) {
        const efficiencyResult = calculateRoutineEfficiency(updatedTaskCompletions);
        
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
              routine_title: selectedRoutine.title,
              user_email: user.email || '',
              total_time_saved: totalTimeSaved,
              total_routine_duration: totalRoutineDuration,
              efficiency_percentage: efficiencyPercentage,
              has_regular_tasks: hasRegularTasks,
            });
          
          if (error) throw error;
          
          // Invalidate efficiency stats to refresh badge
          queryClient.invalidateQueries({ queryKey: ['efficiency-stats', user.id] });
          
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
      } else if (!hasRegularTasks && selectedRoutine) {
        // Handle routines with only focus tasks - no efficiency calculation
        try {
          const { error } = await supabase
            .from('routine_completions')
            .insert({
              user_id: user.id,
              routine_id: selectedRoutineId,
              routine_title: selectedRoutine.title,
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
      resetRoutineState();
      setSelectedRoutineId(null);
    }
  };

  const handleStartRoutine = () => {
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
    setTaskCompletions([]); // Reset task completions for new routine
    setIsRoutineStarted(true);
    setIsPaused(false);
  };

  const handlePauseRoutine = () => {
    setIsPaused(!isPaused);
  };

  const handleRoutineSelect = (routineId: string) => {
    resetRoutineState();
    setTaskStartTimes({});
    setTaskCompletions([]); // Reset task completions when selecting new routine
    setSelectedRoutineId(routineId);
  };

  const handleTaskReorder = (reorderedTasks: Task[]) => {
    setOrderedTasks(reorderedTasks);
  };

  const processedTasks: Task[] = orderedTasks.map((task, index) => ({
    ...task,
    isCompleted: completedTaskIds.includes(task.id),
    isActive: isRoutineStarted && 
              !completedTaskIds.includes(task.id) && 
              completedTaskIds.length === index,
    timeLeft: timers[task.id]
  }));

  // Find the selected routine to get its title
  const selectedRoutine = routines?.find(routine => routine.id === selectedRoutineId);

  return (
    <SidebarLayout onSignOut={handleSignOut} totalTimeSaved={totalTimeSaved} userId={user.id}>
      <div className="space-y-4 md:space-y-6 p-3 md:p-6 max-w-full overflow-hidden">
        
        {/* Efficiency Badge - Hero Display */}
        <EfficiencyBadge userId={user.id} variant="hero" />
        
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
