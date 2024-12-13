import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { SupabaseClient } from '@supabase/supabase-js';
import Layout from '@/components/Layout';
import { Plus, List, Clock, Trash2 } from 'lucide-react';
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
  const [routineTasks, setRoutineTasks] = useState<RoutineTask[]>([]);
  const [newRoutineTitle, setNewRoutineTitle] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDuration, setNewTaskDuration] = useState('');

  useEffect(() => {
    fetchRoutines();
  }, []);

  useEffect(() => {
    if (selectedRoutine) {
      fetchRoutineTasks(selectedRoutine);
    }
  }, [selectedRoutine]);

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

    setRoutineTasks(data);
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

  const handleCreateTask = async () => {
    if (!selectedRoutine || !newTaskTitle.trim() || !newTaskDuration) {
      toast.error('Please fill in all task details');
      return;
    }

    const position = routineTasks.length;
    const { data, error } = await supabase
      .from('routine_tasks')
      .insert([
        {
          routine_id: selectedRoutine,
          title: newTaskTitle,
          duration: parseInt(newTaskDuration),
          position
        }
      ])
      .select()
      .single();

    if (error) {
      toast.error('Failed to create task');
      return;
    }

    setRoutineTasks([...routineTasks, data]);
    setNewTaskTitle('');
    setNewTaskDuration('');
    toast.success('Task added successfully');
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
      setRoutineTasks([]);
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

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Routines List</h3>
            <div className="space-y-2">
              {routines.map((routine) => (
                <div
                  key={routine.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedRoutine === routine.id
                      ? 'border-ninja-primary bg-ninja-primary/10'
                      : 'border-gray-200 hover:border-ninja-primary/50'
                  }`}
                  onClick={() => setSelectedRoutine(routine.id)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <List className="w-5 h-5 text-ninja-primary" />
                      <span className="font-medium">{routine.title}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRoutine(routine.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-gray-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedRoutine && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Tasks</h3>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full bg-ninja-accent text-white hover:bg-ninja-accent/90">
                    <Plus className="w-4 h-4 mr-2" /> Add Task
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Task</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Task Name</label>
                      <Input
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Enter task name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Duration (minutes)</label>
                      <Input
                        type="number"
                        value={newTaskDuration}
                        onChange={(e) => setNewTaskDuration(e.target.value)}
                        placeholder="Enter duration in minutes"
                        min="1"
                      />
                    </div>
                    <Button
                      className="w-full bg-ninja-primary text-white hover:bg-ninja-primary/90"
                      onClick={handleCreateTask}
                    >
                      Add Task
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="space-y-2">
                {routineTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 rounded-lg border border-gray-200 flex justify-between items-center"
                  >
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-ninja-primary" />
                      <span>{task.title}</span>
                    </div>
                    <span className="text-sm text-gray-500">{task.duration} min</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Routines;