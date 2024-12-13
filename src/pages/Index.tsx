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
    { id: '1', title: 'Task 1', duration: 5, isActive: false, isCompleted: false },
    { id: '2', title: 'Task 2', duration: 10, isActive: false, isCompleted: false },
    { id: '3', title: 'Task 3', duration: 15, isActive: false, isCompleted: false },
  ]);

  const [isRoutineStarted, setIsRoutineStarted] = useState(false);
  const [totalTimeSaved, setTotalTimeSaved] = useState(0);

  useEffect(() => {
    fetchTotalTimeSaved();
  }, []);

  const fetchTotalTimeSaved = async () => {
    const { data, error } = await supabase
      .from('task_completions')
      .select('time_saved')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching total time saved:', error);
      return;
    }

    const total = data.reduce((sum, record) => sum + record.time_saved, 0);
    setTotalTimeSaved(total);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleTaskComplete = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedTasks = tasks.map(t =>
      t.id === taskId ? { ...t, isCompleted: true } : t
    );
    setTasks(updatedTasks);

    // Update total time saved
    const timeSaved = task.duration;
    setTotalTimeSaved(prev => prev + timeSaved);

    // Record task completion in Supabase
    const { error } = await supabase
      .from('task_completions')
      .insert([
        {
          user_id: user.id,
          task_title: task.title,
          time_saved: timeSaved
        }
      ]);

    if (error) {
      console.error('Error recording task completion:', error);
      toast.error("Failed to save task completion");
      return;
    }

    toast.success(`Task completed! Time saved: ${timeSaved} minutes.`);
  };

  const handleStartRoutine = () => {
    setIsRoutineStarted(true);
    toast("Routine started! Let's get productive!");
  };

  const completedTasks = tasks.filter(task => task.isCompleted).length;

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