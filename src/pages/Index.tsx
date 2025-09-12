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
    isPaused,
    setIsPaused,
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
    
    // Check for payment success/cancel in URL params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      // Payment successful, refresh subscription status
      toast.success('Payment successful! Welcome to Pro!');
      setTimeout(() => {
        checkSubscription();
      }, 2000); // Give Stripe time to process
      
      // Clean up URL params
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('canceled') === 'true') {
      // Payment canceled
      toast.info('Payment canceled');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
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
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        // Use Stripe payment link as fallback
        const stripePaymentUrl = 'https://buy.stripe.com/fZedRM7Co6Qe2qc144';
        window.open(stripePaymentUrl, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      // Use Stripe payment link as fallback
      const stripePaymentUrl = 'https://buy.stripe.com/fZedRM7Co6Qe2qc144';
      window.open(stripePaymentUrl, '_blank');
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
    setIsPaused(false);
  };

  const handlePauseRoutine = () => {
    setIsPaused(!isPaused);
  };

  const handleRoutineSelect = (routineId: string) => {
    if (!isSubscribed && routines && routines.length > 1) {
      toast.error('Free users are limited to 1 routine. Please upgrade to use multiple routines.');
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

  // Find the selected routine to get its title
  const selectedRoutine = routines?.find(routine => routine.id === selectedRoutineId);

  return (
    <SidebarLayout onSignOut={handleSignOut} totalTimeSaved={totalTimeSaved}>
      <div className="space-y-8 p-6">
        
        {/* Pro Upgrade Banner */}
        {!isSubscribed && (
          <div className="clay-element gradient-clay-accent p-6 glow-jade">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-accent-foreground text-lg">🌟 Upgrade to Pro Ninja</h3>
                <p className="text-accent-foreground/80 text-sm">Unlock unlimited routines for $5/month</p>
              </div>
              <Button
                variant="clay-electric"
                size="lg"
                onClick={handleSubscribe}
              >
                ⚡ Subscribe Now
              </Button>
            </div>
          </div>
        )}

        {/* Routine Selector - Ninja Scroll Style */}
        <div className="clay-element">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
              <span className="clay-element w-10 h-10 gradient-clay-primary rounded-xl flex items-center justify-center">
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
          <div className="clay-element">
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
            />
          </div>
        )}
        
        {/* Empty State - Encouraging message */}
        {!selectedRoutineId && routines && routines.length === 0 && (
          <div className="clay-element text-center p-12">
            <div className="clay-element w-20 h-20 gradient-clay-accent rounded-full mx-auto mb-6 flex items-center justify-center glow-jade">
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
        
      </div>
    </SidebarLayout>
  );
};

export default Index;
