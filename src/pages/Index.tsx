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

interface IndexProps {
  user: User;
  supabase: SupabaseClient;
}

const Index = ({ user, supabase }: IndexProps) => {
  const { totalTimeSaved, recordTaskCompletion } = useTimeTracking();
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(
    () => localStorage.getItem('selectedRoutineId')
  );
  const [orderedTasks, setOrderedTasks] = useState<Task[]>([]);
  
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
    resetRoutineState
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

    setCompletedTaskIds(prev => [...prev, taskId]);
    await recordTaskCompletion(task.title, timeSaved);
    
    // Update task performance metrics
    await updateTaskPerformanceMetrics(taskId, user.id, timeSaved);

    const updatedCompletedTasks = [...completedTaskIds, taskId];
    if (orderedTasks && updatedCompletedTasks.length === orderedTasks.length) {
      resetRoutineState();
      setSelectedRoutineId(null);
    }
  };

  const handleStartRoutine = () => {
    const initialTimers: { [key: string]: number } = {};
    orderedTasks.forEach(task => {
      initialTimers[task.id] = task.duration * 60;
    });
    
    setTimers(initialTimers);
    setIsRoutineStarted(true);
    setIsPaused(false);
  };

  const handlePauseRoutine = () => {
    setIsPaused(!isPaused);
  };

  const handleRoutineSelect = (routineId: string) => {
    resetRoutineState();
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
    <SidebarLayout onSignOut={handleSignOut} totalTimeSaved={totalTimeSaved}>
      <div className="space-y-4 md:space-y-6 p-3 md:p-6 max-w-full overflow-hidden">
        
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
