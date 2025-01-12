import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { SupabaseClient } from '@supabase/supabase-js';
import Layout from '@/components/Layout';
import RoutineContainer from '@/components/RoutineContainer';
import { Task } from '@/types';
import { useTimeTracking } from '@/contexts/TimeTrackingContext';
import { useQuery } from "@tanstack/react-query";
import RoutineSelector from '@/components/RoutineSelector';
import { useRoutineState } from '@/hooks/useRoutineState';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface IndexProps {
  user: User;
  supabase: SupabaseClient;
}

const Index = ({ user, supabase }: IndexProps) => {
  const { totalTimeSaved, recordTaskCompletion } = useTimeTracking();
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);
  const [orderedTasks, setOrderedTasks] = useState<Task[]>([]);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  
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

  useEffect(() => {
    checkSubscription();
  }, []);

  useEffect(() => {
    if (tasks) {
      setOrderedTasks(tasks);
    }
  }, [tasks]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const checkSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      setIsSubscribed(data.subscribed);
    } catch (error) {
      console.error('Error checking subscription:', error);
      toast.error('Failed to check subscription status');
    }
  };

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      if (error) throw error;
      
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('Failed to start subscription process');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskComplete = async (taskId: string, timeSaved: number) => {
    const task = orderedTasks.find(t => t.id === taskId);
    if (!task) return;

    setCompletedTaskIds(prev => [...prev, taskId]);
    await recordTaskCompletion(task.title, timeSaved);

    const updatedCompletedTasks = [...completedTaskIds, taskId];
    if (orderedTasks && updatedCompletedTasks.length === orderedTasks.length) {
      resetRoutineState();
    }
  };

  const handleStartRoutine = () => {
    const initialTimers: { [key: string]: number } = {};
    orderedTasks.forEach(task => {
      initialTimers[task.id] = task.duration * 60;
    });
    
    setTimers(initialTimers);
    setIsRoutineStarted(true);
  };

  const handleRoutineSelect = (routineId: string) => {
    if (!isSubscribed && routines && routines.length >= 3) {
      toast.error('Please subscribe to create more than 3 routines');
      return;
    }
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

  return (
    <Layout onSignOut={handleSignOut} totalTimeSaved={totalTimeSaved}>
      <div className="space-y-6">
        {!isSubscribed && (
          <div className="bg-ninja-primary/10 p-4 rounded-lg flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Upgrade to Pro</h3>
              <p className="text-sm text-gray-600">Get unlimited routines for $5/month</p>
            </div>
            <Button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="bg-ninja-primary hover:bg-ninja-primary/90"
            >
              {isLoading ? 'Loading...' : 'Subscribe Now'}
            </Button>
          </div>
        )}

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
            onTaskReorder={handleTaskReorder}
          />
        )}
      </div>
    </Layout>
  );
};

export default Index;