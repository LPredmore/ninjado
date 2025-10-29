import { useState, useMemo } from "react";
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
import { queryKeys, invalidateRoutineQueries } from "@/lib/queryKeys";
import { logError } from "@/lib/errorLogger";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { RoutineTask } from "@/types";

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

  // Fetch all tasks for user's routines
  // This query is independent of routines query to avoid race conditions
  const { data: tasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: queryKeys.allRoutineTasks(user.id),
    queryFn: async () => {
      // Fetch routine IDs internally to avoid race conditions
      const { data: userRoutines, error: routinesError } = await supabase
        .from("routines")
        .select("id")
        .eq("user_id", user.id);

      if (routinesError) throw routinesError;
      if (!userRoutines || userRoutines.length === 0) return [];
      
      const routineIds = userRoutines.map(r => r.id);
      
      const { data, error } = await supabase
        .from("routine_tasks")
        .select("*")
        .in("routine_id", routineIds)
        .order("position", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Create a Map for O(1) task lookup by routine_id (eliminates N+1 filtering)
  const tasksByRoutineId = useMemo(() => {
    const map = new Map<string, RoutineTask[]>();
    tasks?.forEach(task => {
      const routineTasks = map.get(task.routine_id) || [];
      routineTasks.push(task);
      map.set(task.routine_id, routineTasks);
    });
    return map;
  }, [tasks]);


  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleAddRoutineClick = () => {
    setIsAddRoutineOpen(true);
  };

  const handleDeleteRoutine = async (routineId: string) => {
    // Optimistic update - remove routine from UI immediately
    const previousRoutines = routines;
    queryClient.setQueryData(
      queryKeys.routines(user.id),
      (old: any) => old?.filter((r: any) => r.id !== routineId) || []
    );

    try {
      const { error } = await supabase.from("routines").delete().eq("id", routineId);
      if (error) throw error;
      
      toast.success("Routine deleted successfully");
      invalidateRoutineQueries(queryClient, user.id);
    } catch (error) {
      // Rollback on error
      queryClient.setQueryData(queryKeys.routines(user.id), previousRoutines);
      
      logError("Failed to delete routine", error, {
        component: "Routines",
        action: "handleDeleteRoutine",
        routineId,
      });
      
      toast.error("Failed to delete routine", {
        action: {
          label: "Retry",
          onClick: () => handleDeleteRoutine(routineId),
        },
      });
    }
  };

  return (
    <ErrorBoundary>
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
              <div key={i} className="clay-element-with-transition p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-5 w-5 rounded" />
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {routinesError && (
          <div className="clay-element-with-transition text-center p-12 border-destructive/50">
            <h3 className="text-xl font-bold text-destructive mb-3">Failed to Load Routines</h3>
            <p className="text-muted-foreground mb-6">{routinesError.message}</p>
            <Button variant="clay-jade" onClick={() => queryClient.invalidateQueries({ queryKey: queryKeys.routines(user.id) })}>
              Try Again
            </Button>
          </div>
        )}

        {/* Tasks Loading Indicator */}
        {isLoadingTasks && (
          <div className="clay-element-with-transition p-4 text-center">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              <span className="ml-3 text-muted-foreground">Loading tasks...</span>
            </div>
          </div>
        )}

        {/* Routines Grid */}
        {!isLoadingRoutines && !routinesError && routines && routines.length > 0 && (
          <div className="grid gap-6">
            {routines.map((routine) => (
              <RoutineItem
                key={`${routine.id}-${tasksByRoutineId.get(routine.id)?.length || 0}`}
                routine={routine}
                tasks={tasksByRoutineId.get(routine.id) || []}
                onDelete={handleDeleteRoutine}
                supabase={supabase}
                userId={user.id}
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
          userId={user.id}
        />
        </div>
      </SidebarLayout>
    </ErrorBoundary>
  );
};

export default Routines;
