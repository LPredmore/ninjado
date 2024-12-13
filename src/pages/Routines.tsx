import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { SupabaseClient } from '@supabase/supabase-js';
import Layout from '@/components/Layout';
import { Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import RoutineItem from '@/components/RoutineItem';

interface RoutinesProps {
  user: User;
  supabase: SupabaseClient;
}

interface Routine {
  id: string;
  title: string;
  created_at: string;
}

interface RoutineTask {
  id: string;
  title: string;
  duration: number;
  position: number;
}

const Routines = ({ user, supabase }: RoutinesProps) => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [selectedRoutine, setSelectedRoutine] = useState<string | null>(null);
  const [routineTasks, setRoutineTasks] = useState<{ [key: string]: RoutineTask[] }>({});
  const [newRoutineTitle, setNewRoutineTitle] = useState('');

  useEffect(() => {
    fetchRoutines();
  }, []);

  useEffect(() => {
    if (routines.length > 0) {
      fetchAllRoutineTasks();
    }
  }, [routines]);

  const fetchRoutines = async () => {
    const { data, error } = await supabase
      .from('routines')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch routines');
      return;
    }

    setRoutines(data);
  };

  const fetchAllRoutineTasks = async () => {
    const tasks: { [key: string]: RoutineTask[] } = {};
    
    for (const routine of routines) {
      const { data, error } = await supabase
        .from('routine_tasks')
        .select('*')
        .eq('routine_id', routine.id)
        .order('position', { ascending: true });

      if (!error && data) {
        tasks[routine.id] = data;
      }
    }

    setRoutineTasks(tasks);
  };

  const handleCreateRoutine = async () => {
    if (!newRoutineTitle.trim()) {
      toast.error('Please enter a routine title');
      return;
    }

    const { data, error } = await supabase
      .from('routines')
      .insert([
        {
          title: newRoutineTitle,
          user_id: user.id
        }
      ])
      .select()
      .single();

    if (error) {
      toast.error('Failed to create routine');
      return;
    }

    setRoutines([...routines, data]);
    setNewRoutineTitle('');
    toast.success('Routine created successfully');
  };

  const handleDeleteRoutine = async (routineId: string) => {
    const { error } = await supabase
      .from('routines')
      .delete()
      .eq('id', routineId);

    if (error) {
      toast.error('Failed to delete routine');
      return;
    }

    setRoutines(routines.filter(r => r.id !== routineId));
    if (selectedRoutine === routineId) {
      setSelectedRoutine(null);
    }
    toast.success('Routine deleted successfully');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Layout onSignOut={handleSignOut} totalTimeSaved={0}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">My Routines</h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-ninja-accent text-white hover:bg-ninja-accent/90">
                <Plus className="w-4 h-4 mr-2" /> New Routine
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Routine</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Routine Name</label>
                  <Input
                    value={newRoutineTitle}
                    onChange={(e) => setNewRoutineTitle(e.target.value)}
                    placeholder="Enter routine name"
                  />
                </div>
                <Button
                  className="w-full bg-ninja-primary text-white hover:bg-ninja-primary/90"
                  onClick={handleCreateRoutine}
                >
                  Create Routine
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {routines.map((routine) => (
            <RoutineItem
              key={routine.id}
              routine={routine}
              tasks={routineTasks[routine.id] || []}
              onDelete={handleDeleteRoutine}
              supabase={supabase}
              onTasksUpdate={fetchAllRoutineTasks}
              isSelected={selectedRoutine === routine.id}
              onSelect={() => setSelectedRoutine(routine.id)}
            />
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Routines;