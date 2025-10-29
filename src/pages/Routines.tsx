import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { SupabaseClient } from "@supabase/supabase-js";
import SidebarLayout from "@/components/SidebarLayout";
import { useTimeTracking } from "@/contexts/TimeTrackingContext";
import { Button } from "@/components/ui/button";
import { Plus, List } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AddRoutineDialog } from "@/components/AddRoutineDialog";
import RoutineItem from "@/components/RoutineItem";
import { toast } from "sonner";
import { queryKeys } from "@/lib/queryKeys";

interface RoutinesProps {
  user: User;
  supabase: SupabaseClient;
}

const Routines = ({ user, supabase }: RoutinesProps) => {
  const { totalTimeSaved } = useTimeTracking();
  const [isAddRoutineOpen, setIsAddRoutineOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: routines, isLoading: isLoadingRoutines, error: routinesError } = useQuery({
    queryKey: queryKeys.routines(user.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("routines")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: tasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: queryKeys.allRoutineTasks(user.id),
    queryFn: async () => {
      const routineIds = routines?.map(r => r.id) || [];
      if (routineIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from("routine_tasks")
        .select("*")
        .in("routine_id", routineIds)
        .order("position", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!routines && routines.length > 0,
  });


  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleAddRoutineClick = () => {
    setIsAddRoutineOpen(true);
  };

  const handleDeleteRoutine = async (routineId: string) => {
    try {
      const { error } = await supabase.from("routines").delete().eq("id", routineId);
      if (error) throw error;
      
      toast.success("Routine deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["routines"] });
    } catch (error) {
      console.error("Error deleting routine:", error);
      toast.error("Failed to delete routine", {
        action: {
          label: "Retry",
          onClick: () => handleDeleteRoutine(routineId),
        },
      });
    }
  };

  const handleRoutineUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ["routines"] });
  };

  return (
    <SidebarLayout onSignOut={handleSignOut} totalTimeSaved={totalTimeSaved}>
      <div className="container mx-auto p-4 md:p-6 space-y-6 md:space-y-8">
        
        {/* Page Header */}
        <div className="text-center">
          <div className="clay-element-with-transition w-20 h-20 gradient-clay-accent rounded-full mx-auto mb-4 flex items-center justify-center glow-jade">
            <List className="w-10 h-10 text-accent-foreground" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-2">
            Training Routines
          </h1>
          <p className="text-muted-foreground">Create and manage your ninja training sequences</p>
        </div>

        {/* Add Routine Button */}
        <div className="flex justify-center">
          <Button 
            onClick={handleAddRoutineClick}
            variant="clay-jade"
            size="lg"
            className="glow-jade"
          >
            <Plus className="mr-2 w-5 h-5" />
            Add New Routine
          </Button>
        </div>

        {/* Loading State */}
        {isLoadingRoutines && (
          <div className="grid gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="clay-element-with-transition p-4 animate-pulse">
                <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-muted rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {routinesError && (
          <div className="clay-element-with-transition text-center p-12 border-destructive/50">
            <h3 className="text-xl font-bold text-destructive mb-3">Failed to Load Routines</h3>
            <p className="text-muted-foreground mb-6">{routinesError.message}</p>
            <Button variant="clay-jade" onClick={() => queryClient.invalidateQueries({ queryKey: ["routines"] })}>
              Try Again
            </Button>
          </div>
        )}

        {/* Tasks Loading Indicator */}
        {isLoadingTasks && routines && routines.length > 0 && (
          <div className="text-center text-muted-foreground animate-pulse">
            Loading tasks...
          </div>
        )}

        {/* Routines Grid */}
        {!isLoadingRoutines && !routinesError && (
          <div className="grid gap-6">
            {routines?.map((routine) => (
              <RoutineItem
                key={routine.id}
                routine={routine}
                tasks={tasks?.filter((task) => task.routine_id === routine.id) || []}
                onDelete={handleDeleteRoutine}
                supabase={supabase}
                onTasksUpdate={handleRoutineUpdate}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoadingRoutines && (!routines || routines.length === 0) && (
          <div className="clay-element-with-transition text-center p-12">
            <div className="clay-element-with-transition w-20 h-20 gradient-clay-accent rounded-full mx-auto mb-6 flex items-center justify-center glow-jade">
              <List className="w-10 h-10 text-accent-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">No Training Routines Yet</h3>
            <p className="text-muted-foreground mb-6">Create your first routine to start your ninja training journey.</p>
            <Button variant="clay-jade" size="lg" onClick={handleAddRoutineClick}>
              <Plus className="w-5 h-5 mr-2" />
              Create First Routine
            </Button>
          </div>
        )}

        <AddRoutineDialog
          open={isAddRoutineOpen}
          onOpenChange={setIsAddRoutineOpen}
          supabase={supabase}
          onRoutineAdded={handleRoutineUpdate}
        />
      </div>
    </SidebarLayout>
  );
};

export default Routines;
