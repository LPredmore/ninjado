import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { SupabaseClient } from '@supabase/supabase-js';
import Layout from '@/components/Layout';
import RoutineContainer from '@/components/RoutineContainer';
import { Task } from '@/types';
import { toast } from "sonner";

interface IndexProps {
  user: User;
  supabase: SupabaseClient;
}

const Index = ({ user, supabase }: IndexProps) => {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Task 1', completed: false },
    { id: '2', title: 'Task 2', completed: false },
    { id: '3', title: 'Task 3', completed: false },
  ]);

  const [isRoutineStarted, setIsRoutineStarted] = useState(false);
  const [totalTimeSaved, setTotalTimeSaved] = useState(0);

  useEffect(() => {
    fetchTotalTimeSaved();
  }, []);

  const fetchTotalTimeSaved = async () => {
    const { data, error } = await supabase
      .from('time_saved')
      .select('total_time')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching total time saved:', error);
      return;
    }

    setTotalTimeSaved(data.total_time || 0);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleTaskComplete = async (taskId: string, timeTaken: number) => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, completed: true } : task
    );
    setTasks(updatedTasks);
    setTotalTimeSaved(prev => prev + timeTaken);
    toast.success(`Task completed! Time saved: ${timeTaken} minutes.`);
  };

  const handleStartRoutine = () => {
    setIsRoutineStarted(true);
    toast("Routine started! Let's get productive!");
  };

  const completedTasks = tasks.filter(task => task.completed).length;

  return (
    <Layout onSignOut={handleSignOut} totalTimeSaved={totalTimeSaved}>
      <RoutineContainer
        tasks={tasks}
        completedTasks={completedTasks}
        isRoutineStarted={isRoutineStarted}
        onStartRoutine={handleStartRoutine}
        onTaskComplete={handleTaskComplete}
      />
    </Layout>
  );
};

export default Index;
