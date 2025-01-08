import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { SupabaseClient } from '@supabase/supabase-js';
import Layout from '@/components/Layout';
import RoutineContainer from '@/components/RoutineContainer';
import { Task } from '@/types';
import { useTimeTracking } from '@/contexts/TimeTrackingContext';
import { useQuery } from "@tanstack/react-query";
import RoutineSelector from '@/components/RoutineSelector';
import { useRoutineState } from '@/hooks/useRoutineState';

interface IndexProps {
  user: User;
  supabase: SupabaseClient;
}

const Index = ({ user, supabase }: IndexProps) => {
  const { totalTimeSaved, recordTaskCompletion } = useTimeTracking();
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);
  
  const {
    isRoutineStarted,
    setIsRoutineStarted,
    timers,
    setTimers,
    completedTaskIds,
    setCompletedTaskIds,
    resetRoutineState
  } = useRoutineState(selectedRoutineId);

  const { data: routines } = useQuery({
    queryKey: ["routines"],
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
    queryKey: ["tasks", selectedRoutineId],
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

  // Add back the handleSignOut function
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleTaskComplete = async (taskId: string, timeSaved: number) => {
    const task = tasks?.find(t => t.id === taskId);
    if (!task) return;

    setCompletedTaskIds(prev => [...prev, taskId]);
    await recordTaskCompletion(task.title, timeSaved);

    // Check if all tasks are completed
    const updatedCompletedTasks = [...completedTaskIds, taskId];
    if (tasks && updatedCompletedTasks.length === tasks.length) {
      resetRoutineState();
    }
  };

  const handleStartRoutine = () => {
    if (!tasks) return;
    
    // Initialize timers for all tasks
    const initialTimers: { [key: string]: number } = {};
    tasks.forEach(task => {
      initialTimers[task.id] = task.duration * 60;
    });
    
    setTimers(initialTimers);
    setIsRoutineStarted(true);
  };

  const handleRoutineSelect = (routineId: string) => {
    resetRoutineState();
    setSelectedRoutineId(routineId);
  };

  // Transform tasks to include completion status and active state
  const processedTasks: Task[] = tasks?.map((task, index) => ({
    ...task,
    isCompleted: completedTaskIds.includes(task.id),
    isActive: isRoutineStarted && 
              !completedTaskIds.includes(task.id) && 
              completedTaskIds.length === index,
    timeLeft: timers[task.id]
  })) || [];

  return (
    <Layout onSignOut={handleSignOut} totalTimeSaved={totalTimeSaved}>
      <div className="space-y-6">
        <div className="w-full">
          <RoutineSelector
            routines={routines || []}
            selectedRoutineId={selectedRoutineId}
            onRoutineSelect={handleRoutineSelect}
          />
        </div>

        {selectedRoutineId && (
          <RoutineContainer
            tasks={processedTasks}
            completedTasks={completedTaskIds.length}
            isRoutineStarted={isRoutineStarted}
            onStartRoutine={handleStartRoutine}
            onTaskComplete={handleTaskComplete}
          />
        )}
      </div>
    </Layout>
  );
};

export default Index;