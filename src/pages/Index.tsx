import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { SupabaseClient } from '@supabase/supabase-js';
import Layout from '@/components/Layout';
import RoutineContainer from '@/components/RoutineContainer';
import { Task } from '@/types';
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface IndexProps {
  user: User;
  supabase: SupabaseClient;
}

interface Routine {
  id: string;
  title: string;
}

const Index = ({ user, supabase }: IndexProps) => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isRoutineStarted, setIsRoutineStarted] = useState(false);
  const [totalTimeSaved, setTotalTimeSaved] = useState(0);
  const [timers, setTimers] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    fetchRoutines();
    fetchTotalTimeSaved();
  }, []);

  useEffect(() => {
    if (selectedRoutineId) {
      fetchRoutineTasks(selectedRoutineId);
    }
  }, [selectedRoutineId]);

  useEffect(() => {
    let intervals: NodeJS.Timeout[] = [];

    if (isRoutineStarted) {
      const activeTask = tasks.find(t => t.isActive && !t.isCompleted);
      if (activeTask) {
        const interval = setInterval(() => {
          setTimers(prev => ({
            ...prev,
            [activeTask.id]: Math.max(0, (prev[activeTask.id] || activeTask.duration * 60) - 1)
          }));
        }, 1000);
        intervals.push(interval);
      }
    }

    return () => intervals.forEach(clearInterval);
  }, [isRoutineStarted, tasks]);

  const fetchRoutines = async () => {
    const { data, error } = await supabase
      .from('routines')
      .select('id, title');

    if (error) {
      console.error('Error fetching routines:', error);
      return;
    }

    setRoutines(data);
  };

  const fetchRoutineTasks = async (routineId: string) => {
    const { data, error } = await supabase
      .from('routine_tasks')
      .select('*')
      .eq('routine_id', routineId)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching routine tasks:', error);
      return;
    }

    const formattedTasks: Task[] = data.map((task, index) => ({
      id: task.id,
      title: task.title,
      duration: task.duration,
      isActive: index === 0,
      isCompleted: false
    }));

    setTasks(formattedTasks);
    
    const initialTimers: { [key: string]: number } = {};
    formattedTasks.forEach(task => {
      initialTimers[task.id] = task.duration * 60;
    });
    setTimers(initialTimers);
  };

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

    const timeLeft = timers[taskId] || 0;
    const timeSaved = Math.max(0, (task.duration * 60 - timeLeft) / 60);

    const currentIndex = tasks.findIndex(t => t.id === taskId);
    const updatedTasks = tasks.map((t, index) => ({
      ...t,
      isCompleted: t.id === taskId ? true : t.isCompleted,
      isActive: index === currentIndex + 1
    }));

    setTasks(updatedTasks);
    setTotalTimeSaved(prev => prev + timeSaved);

    const { error } = await supabase
      .from('task_completions')
      .insert([
        {
          user_id: user.id,
          task_title: task.title,
          time_saved: Math.round(timeSaved)
        }
      ]);

    if (error) {
      console.error('Error recording task completion:', error);
      toast.error("Failed to save task completion");
      return;
    }

    toast.success(`Task completed! Time saved: ${Math.round(timeSaved)} minutes.`);

    // Check if all tasks are completed
    if (updatedTasks.every(t => t.isCompleted)) {
      setIsRoutineStarted(false);
      toast.success("Routine completed! Great job!");
    }
  };

  const handleStartRoutine = () => {
    setIsRoutineStarted(true);
    setTasks(tasks.map((task, index) => ({
      ...task,
      isActive: index === 0,
      isCompleted: false
    })));

    const initialTimers: { [key: string]: number } = {};
    tasks.forEach(task => {
      initialTimers[task.id] = task.duration * 60;
    });
    setTimers(initialTimers);
    toast("Routine started! Let's get productive!");
  };

  const completedTasks = tasks.filter(task => task.isCompleted).length;

  return (
    <Layout onSignOut={handleSignOut} totalTimeSaved={totalTimeSaved}>
      <div className="space-y-6">
        <div className="w-full">
          <Select
            value={selectedRoutineId || ''}
            onValueChange={(value) => {
              setSelectedRoutineId(value);
              setIsRoutineStarted(false);
              setTasks(tasks.map(t => ({ ...t, isCompleted: false, isActive: false })));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a routine" />
            </SelectTrigger>
            <SelectContent>
              {routines.map((routine) => (
                <SelectItem key={routine.id} value={routine.id}>
                  {routine.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedRoutineId && (
          <RoutineContainer
            tasks={tasks.map(task => ({
              ...task,
              timeLeft: timers[task.id]
            }))}
            completedTasks={completedTasks}
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