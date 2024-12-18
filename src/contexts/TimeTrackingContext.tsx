import { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

interface TimeTrackingContextType {
  totalTimeSaved: number;
  recordTaskCompletion: (taskTitle: string, timeSaved: number) => Promise<void>;
  refreshTotalTimeSaved: () => Promise<void>;
}

const TimeTrackingContext = createContext<TimeTrackingContextType | undefined>(undefined);

export function TimeTrackingProvider({ children, user }: { children: React.ReactNode; user: User }) {
  const [totalTimeSaved, setTotalTimeSaved] = useState(0);

  const fetchTotalTimeSaved = async () => {
    const { data: timeData, error: timeError } = await supabase
      .from('task_completions')
      .select('time_saved')
      .eq('user_id', user.id);

    if (timeError) {
      console.error('Error fetching total time saved:', timeError);
      return;
    }

    const totalSaved = timeData.reduce((sum, record) => sum + record.time_saved, 0);

    // Get total time spent on rewards
    const { data: redemptionsData, error: redemptionsError } = await supabase
      .from('reward_redemptions')
      .select('time_spent')
      .eq('user_id', user.id);

    if (redemptionsError) {
      console.error('Error fetching reward redemptions:', redemptionsError);
      return;
    }

    const totalSpent = redemptionsData.reduce((sum, record) => sum + record.time_spent, 0);

    // Set the net time saved (total saved minus total spent)
    setTotalTimeSaved(totalSaved - totalSpent);
  };

  const recordTaskCompletion = async (taskTitle: string, timeSaved: number) => {
    const { error } = await supabase
      .from('task_completions')
      .insert([
        {
          user_id: user.id,
          task_title: taskTitle,
          time_saved: timeSaved
        }
      ]);

    if (error) {
      console.error('Error recording task completion:', error);
      toast.error('Failed to record task completion');
      return;
    }

    if (timeSaved > 0) {
      toast.success(`You saved ${timeSaved} seconds!`);
    } else {
      toast.warning(`You went over by ${Math.abs(timeSaved)} seconds`);
    }
    
    await fetchTotalTimeSaved();
  };

  useEffect(() => {
    fetchTotalTimeSaved();
  }, [user.id]);

  return (
    <TimeTrackingContext.Provider value={{ 
      totalTimeSaved, 
      recordTaskCompletion,
      refreshTotalTimeSaved: fetchTotalTimeSaved 
    }}>
      {children}
    </TimeTrackingContext.Provider>
  );
}

export function useTimeTracking() {
  const context = useContext(TimeTrackingContext);
  if (context === undefined) {
    throw new Error('useTimeTracking must be used within a TimeTrackingProvider');
  }
  return context;
}