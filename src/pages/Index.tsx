import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { SupabaseClient } from '@supabase/supabase-js';
import Layout from '@/components/Layout';
import RoutineContainer from '@/components/RoutineContainer';
import { Task } from '@/types';
import { toast } from "sonner";
import { useTimeTracking } from '@/hooks/useTimeTracking';
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

const Index = ({ user, supabase }: IndexProps) => {
  const [routines, setRoutines] = useState<{ id: string; title: string; }[]>([]);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isRoutineStarted, setIsRoutineStarted] = useState(false);
  const [timers, setTimers] = useState<{ [key: string]: number }>({});
  const { totalTimeSaved, recordTaskCompletion } = useTimeTracking(user);

  useEffect(() => {
    fetchRoutines();
  }, []);

  useEffect(() => {
    if (selectedRoutineId) {
      fetchRoutineTasks(selectedRoutineId);
    }
  }, [selectedRoutineId]);

  // Single interval effect to handle all active timers
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (isRoutineStarted) {
      intervalId = setInterval(() => {
        setTimers(prevTimers => {
          const activeTask = tasks.find(t => t.isActive && !t.isCompleted);
          if (!activeTask) return prevTimers;

          return {
            ...prevTimers,
            [activeTask.id]: (prevTimers[activeTask.id] || 0) - 1
          };
        });
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRoutineStarted, tasks]);

  const fetchRoutines = async () => {
    const { data, error } = await supabase
      .from('routines')
      .select('id, title')
      .eq('user_id', user.id);

    if (error) {
      toast.error('Failed to fetch routines');
      return;
    }

    setRoutines(data || []);
  };

  const fetchRoutineTasks = async (routineId: string) => {
    const { data, error } = await supabase
      .from('routine_tasks')
      .select('*')
      .eq('routine_id', routineId)
      .order('position', { ascending: true });

    if (error) {
      toast.error('Failed to fetch routine tasks');
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
    
    // Initialize timers only for tasks that don't have a timer yet
    setTimers(prevTimers => {
      const newTimers = { ...prevTimers };
      formattedTasks.forEach(task => {
        if (newTimers[task.id] === undefined) {
          newTimers[task.id] = task.duration * 60;
        }
      });
      return newTimers;
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleTaskComplete = async (taskId: string, timeSaved: number) => {
    const currentIndex = tasks.findIndex(t => t.id === taskId);
    if (currentIndex === -1) return;

    const task = tasks[currentIndex];
    
    // Update tasks array with completion status and next active task
    const updatedTasks = tasks.map((t, index) => ({
      ...t,
      isCompleted: t.id === taskId ? true : t.isCompleted,
      isActive: index === currentIndex + 1
    }));

    setTasks(updatedTasks);
    await recordTaskCompletion(task.title, timeSaved);

    // Check if all tasks are completed
    if (updatedTasks.every(t => t.isCompleted)) {
      setIsRoutineStarted(false);
      toast.success("Routine completed! Great job!");
    }
  };

  const handleStartRoutine = () => {
    // Reset completion status but preserve timer values
    setTasks(tasks.map((task, index) => ({
      ...task,
      isActive: index === 0,
      isCompleted: false
    })));

    // Only initialize timers that don't exist yet
    setTimers(prevTimers => {
      const newTimers = { ...prevTimers };
      tasks.forEach(task => {
        if (newTimers[task.id] === undefined) {
          newTimers[task.id] = task.duration * 60;
        }
      });
      return newTimers;
    });

    setIsRoutineStarted(true);
    toast.success("Routine started! Let's get productive!");
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
              setTimers({}); // Clear timers when switching routines
              setTasks([]); // Clear tasks when switching routines
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