import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { SupabaseClient } from "@supabase/supabase-js";
import Layout from "@/components/Layout";
import { useTimeTracking } from "@/contexts/TimeTrackingContext";
import { Button } from "@/components/ui/button";
import { Plus, Lock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AddRoutineDialog } from "@/components/AddRoutineDialog";
import RoutineItem from "@/components/RoutineItem";
import PinDialog from "@/components/PinDialog";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface RoutinesProps {
  user: User;
  supabase: SupabaseClient;
}

const Routines = ({ user, supabase }: RoutinesProps) => {
  const { totalTimeSaved } = useTimeTracking();
  const [isAddRoutineOpen, setIsAddRoutineOpen] = useState(false);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [pinMode, setPinMode] = useState<'set' | 'verify'>('verify');
  const navigate = useNavigate();

  const { data: pin, refetch: refetchPin } = useQuery({
    queryKey: ["routinePin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("routine_pins")
        .select("pin")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data?.pin;
    },
  });

  const { data: routines, refetch: refetchRoutines } = useQuery({
    queryKey: ["routines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("routines")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isPinVerified,
  });

  const { data: tasks, refetch: refetchTasks } = useQuery({
    queryKey: ["tasks", selectedRoutineId],
    enabled: !!selectedRoutineId && isPinVerified,
    queryFn: async () => {
      if (!selectedRoutineId) return [];
      const { data, error } = await supabase
        .from("routine_tasks")
        .select("*")
        .eq("routine_id", selectedRoutineId)
        .order("position", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (pin) {
      setPinMode('verify');
      setIsPinDialogOpen(true);
    } else {
      setPinMode('set');
      setIsPinDialogOpen(true);
    }
  }, [pin]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleDeleteRoutine = async (routineId: string) => {
    const { error } = await supabase.from("routines").delete().eq("id", routineId);
    if (!error) {
      refetchRoutines();
      if (selectedRoutineId === routineId) {
        setSelectedRoutineId(null);
      }
    }
  };

  const handlePinVerified = async () => {
    if (pinMode === 'set') {
      const { error } = await supabase
        .from('routine_pins')
        .upsert({ user_id: user.id, pin });

      if (error) {
        toast.error('Failed to set PIN');
        return;
      }
      await refetchPin();
      toast.success('PIN set successfully');
    }
    setIsPinDialogOpen(false);
    setIsPinVerified(true);
  };

  if (!isPinVerified) {
    return (
      <Layout onSignOut={handleSignOut} totalTimeSaved={totalTimeSaved}>
        <div className="container mx-auto p-4">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Lock className="w-12 h-12 text-gray-400" />
            <h2 className="text-xl font-semibold">PIN Protected</h2>
            <p className="text-gray-600">Please enter your PIN to access routines</p>
          </div>
          <PinDialog
            isOpen={isPinDialogOpen}
            onClose={() => {
              setIsPinDialogOpen(false);
              navigate('/');
            }}
            onPinVerified={handlePinVerified}
            mode={pinMode}
            currentPin={pin}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout onSignOut={handleSignOut} totalTimeSaved={totalTimeSaved}>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Routines</h1>
          <div className="space-x-2">
            <Button onClick={() => {
              setPinMode('set');
              setIsPinDialogOpen(true);
            }}>
              Change PIN
            </Button>
            <Button onClick={() => setIsAddRoutineOpen(true)}>
              <Plus className="mr-2" />
              Add Routine
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {routines?.map((routine) => (
            <RoutineItem
              key={routine.id}
              routine={routine}
              tasks={tasks?.filter((task) => task.routine_id === routine.id) || []}
              onDelete={handleDeleteRoutine}
              supabase={supabase}
              onTasksUpdate={refetchTasks}
              isSelected={selectedRoutineId === routine.id}
              onSelect={() => setSelectedRoutineId(routine.id)}
            />
          ))}
        </div>

        <AddRoutineDialog
          open={isAddRoutineOpen}
          onOpenChange={setIsAddRoutineOpen}
          supabase={supabase}
          onRoutineAdded={refetchRoutines}
        />
      </div>
    </Layout>
  );
};

export default Routines;