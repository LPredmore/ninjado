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
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface RoutinesProps {
  user: User;
  supabase: SupabaseClient;
}

const Routines = ({ user, supabase }: RoutinesProps) => {
  const { totalTimeSaved } = useTimeTracking();
  const [isAddRoutineOpen, setIsAddRoutineOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [routineToDelete, setRoutineToDelete] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'n',
      metaKey: true,
      handler: () => setIsAddRoutineOpen(true),
    },
    {
      key: 'n',
      ctrlKey: true,
      handler: () => setIsAddRoutineOpen(true),
    },
    {
      key: 'Escape',
      handler: () => {
        setIsAddRoutineOpen(false);
        setDeleteConfirmOpen(false);
      },
    },
  ]);

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
    refetchOnWindowFocus: true,
  });

  // Fetch all tasks for user's routines - optimized to use routines data
  const { data: tasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: queryKeys.allRoutineTasks(user.id),
    queryFn: async () => {
      if (!routines || routines.length === 0) return [];
      
      const routineIds = routines.map(r => r.id);
      
      const { data, error } = await supabase
        .from("routine_tasks")
        .select("*")
        .in("routine_id", routineIds)
        .order("position", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!routines && routines.length > 0,
    refetchOnWindowFocus: true,
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

  const handleDeleteRoutineClick = (routineId: string) => {
    setRoutineToDelete(routineId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteRoutineConfirm = async () => {
    if (!routineToDelete) return;

    const routineId = routineToDelete;
    setDeleteConfirmOpen(false);
    setRoutineToDelete(null);

    // Optimistic update - remove routine from UI immediately
    const previousRoutines = routines;
    queryClient.setQueryData(
      queryKeys.routines(user.id),
      (old: any) => old?.filter((r: any) => r.id !== routineId) || []
    );

    try {
      const { error } = await supabase.from("routines").delete().eq("id", routineId);
      if (error) throw error;
      
      toast.success("Routine deleted successfully", {
        action: {
          label: "Undo",
          onClick: () => {
            queryClient.setQueryData(queryKeys.routines(user.id), previousRoutines);
            toast.success("Routine restored");
          },
        },
      });
      invalidateRoutineQueries(queryClient, user.id);
    } catch (error) {
      // Rollback on error
      queryClient.setQueryData(queryKeys.routines(user.id), previousRoutines);
      
      const errorType = error instanceof Error && error.message.toLowerCase().includes('network') ? 'network' : 'unknown';
      
      logError("Failed to delete routine", error, {
        component: "Routines",
        action: "handleDeleteRoutineConfirm",
        routineId,
        errorType,
      });
      
      toast.error(
        errorType === 'network' 
          ? "Network error - check your connection" 
          : "Failed to delete routine",
        {
          action: {
            label: "Retry",
            onClick: () => handleDeleteRoutineClick(routineId),
          },
        }
      );
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
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="clay-element-with-transition p-6 space-y-4" style={{ animationDelay: `${i * 50}ms` }}>
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

        {/* Tasks Loading Overlay */}
        {isLoadingTasks && !isLoadingRoutines && (
          <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="clay-element-with-transition p-6 text-center bg-card">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-3 h-3 bg-accent rounded-full animate-bounce" style={{ animationDelay: 'var(--delay-stagger-1)' }}></div>
                <div className="w-3 h-3 bg-accent rounded-full animate-bounce" style={{ animationDelay: 'var(--delay-stagger-2)' }}></div>
                <div className="w-3 h-3 bg-accent rounded-full animate-bounce" style={{ animationDelay: 'var(--delay-stagger-3)' }}></div>
                <span className="ml-3 text-muted-foreground">Loading tasks...</span>
              </div>
            </div>
          </div>
        )}

        {/* Routines Grid */}
        {!isLoadingRoutines && !routinesError && routines && routines.length > 0 && (
          <div className="grid gap-6">
            {routines.map((routine, idx) => (
              <div
                key={`${routine.id}-${tasksByRoutineId.get(routine.id)?.length || 0}`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <RoutineItem
                  routine={routine}
                  tasks={tasksByRoutineId.get(routine.id) || []}
                  onDelete={handleDeleteRoutineClick}
                  supabase={supabase}
                  userId={user.id}
                />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoadingRoutines && !isLoadingTasks && (!routines || routines.length === 0) && (
          <div className="clay-element-with-transition text-center p-12">
            <div className="clay-element-with-transition w-20 h-20 gradient-clay-accent rounded-full mx-auto mb-6 flex items-center justify-center glow-jade">
              <List className="w-10 h-10 text-accent-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">No Training Routines Yet</h3>
            <p className="text-muted-foreground mb-6">Create your first routine to start your ninja training journey.</p>
            <p className="text-sm text-muted-foreground mb-6">💡 Tip: Press <kbd className="px-2 py-1 bg-muted rounded text-xs">Cmd/Ctrl + N</kbd> to quickly add a routine</p>
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

        <ConfirmDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          title="Delete Routine?"
          description="This will permanently delete the routine and all its tasks. This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleDeleteRoutineConfirm}
          variant="destructive"
        />
        </div>
      </SidebarLayout>
    </ErrorBoundary>
  );
};

export default Routines;
