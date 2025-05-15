
import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { SupabaseClient } from "@supabase/supabase-js";
import Layout from "@/components/Layout";
import { useTimeTracking } from "@/contexts/TimeTrackingContext";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AddRoutineDialog } from "@/components/AddRoutineDialog";
import RoutineItem from "@/components/RoutineItem";

interface RoutinesProps {
  user: User;
  supabase: SupabaseClient;
}

const Routines = ({ user, supabase }: RoutinesProps) => {
  const { totalTimeSaved } = useTimeTracking();
  const [isAddRoutineOpen, setIsAddRoutineOpen] = useState(false);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);

  const { data: routines, refetch: refetchRoutines } = useQuery({
    queryKey: ["routines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("routines")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      console.log("Fetched routines:", data); // Add log to debug
      return data;
    },
  });

  const { data: tasks, refetch: refetchTasks } = useQuery({
    queryKey: ["tasks", selectedRoutineId],
    enabled: !!selectedRoutineId,
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

  const handleRoutineUpdate = () => {
    refetchRoutines();
    refetchTasks();
  };

  return (
    <Layout onSignOut={handleSignOut} totalTimeSaved={totalTimeSaved}>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Routines</h1>
          <Button onClick={() => setIsAddRoutineOpen(true)}>
            <Plus className="mr-2" />
            Add Routine
          </Button>
        </div>

        <div className="grid gap-4">
          {routines?.map((routine) => (
            <RoutineItem
              key={routine.id}
              routine={routine}
              tasks={tasks?.filter((task) => task.routine_id === routine.id) || []}
              onDelete={handleDeleteRoutine}
              supabase={supabase}
              onTasksUpdate={handleRoutineUpdate}
              isSelected={selectedRoutineId === routine.id}
              onSelect={() => setSelectedRoutineId(routine.id)}
            />
          ))}
        </div>

        <AddRoutineDialog
          open={isAddRoutineOpen}
          onOpenChange={setIsAddRoutineOpen}
          supabase={supabase}
          onRoutineAdded={handleRoutineUpdate}
        />
      </div>
    </Layout>
  );
};

export default Routines;
