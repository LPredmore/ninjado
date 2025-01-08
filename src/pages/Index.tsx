import { useState } from 'react';
import { User, SupabaseClient } from '@supabase/supabase-js';
import Layout from '@/components/Layout';
import RoutineContainer from '@/components/RoutineContainer';
import { useTimeTracking } from '@/contexts/TimeTrackingContext';
import { useQuery } from "@tanstack/react-query";
import RoutineSelector from '@/components/RoutineSelector';
import { Task } from '@/types';
import { useRoutineState } from '@/hooks/useRoutineState';

interface IndexProps {
  user: User;
  supabase: SupabaseClient;
}

const Index = ({ user, supabase }: IndexProps) => {
  const { totalTimeSaved, recordTaskCompletion } = useTimeTracking();
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const { 
    isRoutineStarted, 
    setIsRoutineStarted,
    timers,
    setTimers,
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

      return data.map(task => ({
        ...task,
        isActive: false,
        isCompleted: false,
        isSkipped: false
      })) as Task[];
    },
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleTaskComplete = async (taskId: string, timeSaved: number) => {
    setCompletedTaskIds(prev => [...prev, taskId]);
    await recordTaskCompletion(tasks?.find(t => t.id === taskId)?.title || '', timeSaved);
  };

  const handleStartRoutine = () => {
    setIsRoutineStarted(true);
    // Initialize timers for all tasks
    if (tasks) {
      const initialTimers = tasks.reduce((acc, task) => ({
        ...acc,
        [task.id]: task.duration * 60
      }), {});
      setTimers(initialTimers);
    }
  };

  const handleRoutineSelect = (routineId: string) => {
    setSelectedRoutineId(routineId);
    setCompletedTaskIds([]);
    setIsRoutineStarted(false);
  };

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

        {selectedRoutineId && tasks && (
          <RoutineContainer
            tasks={tasks}
            completedTasks={completedTaskIds.length}
            isRoutineStarted={isRoutineStarted}
            onStartRoutine={handleStartRoutine}
            onTaskComplete={handleTaskComplete}
            timers={timers}
          />
        )}
      </div>
    </Layout>
  );
};

export default Index;