import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/supabase-js';
import { toast } from "sonner";

export const useTimeTracking = (user: User) => {
  const [totalTimeSaved, setTotalTimeSaved] = useState(0);

  const fetchTotalTimeSaved = async () => {
    const { data, error } = await supabase
      .from('task_completions')
      .select('time_saved')
      .eq('user_id', user.id);

    if (error) {
      toast.error('Failed to fetch time saved');
      return;
    }

    const total = data.reduce((sum, record) => sum + record.time_saved, 0);
    setTotalTimeSaved(total);
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
      toast.error('Failed to record task completion');
      return;
    }

    await fetchTotalTimeSaved();
  };

  useEffect(() => {
    fetchTotalTimeSaved();
  }, [user.id]);

  return {
    totalTimeSaved,
    recordTaskCompletion
  };
};