import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { SupabaseClient } from "@supabase/supabase-js";
import SidebarLayout from "@/components/SidebarLayout";
import { useTimeTracking } from "@/contexts/TimeTrackingContext";
import { Button } from "@/components/ui/button";
import { Plus, List } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AddRoutineDialog } from "@/components/AddRoutineDialog";
import RoutineItem from "@/components/RoutineItem";
import { toast } from "sonner";

interface RoutinesProps {
  user: User;
  supabase: SupabaseClient;
}

const Routines = ({ user, supabase }: RoutinesProps) => {
  const { totalTimeSaved } = useTimeTracking();
  const [isAddRoutineOpen, setIsAddRoutineOpen] = useState(false);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);

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

  const checkSubscription = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        setIsSubscribed(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: { Authorization: `Bearer ${session.session.access_token}` }
      });

      if (error) {
        console.error('Subscription check error:', error);
        setIsSubscribed(false);
        return;
      }

      setIsSubscribed(data?.subscribed || false);
    } catch (error) {
      console.error('Subscription check failed:', error);
      setIsSubscribed(false);
    } finally {
      setIsCheckingSubscription(false);
    }
  };

  useEffect(() => {
    checkSubscription();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleAddRoutineClick = () => {
    if (!isSubscribed && routines && routines.length >= 1) {
      toast.error("Free users are limited to 1 routine. Please upgrade to create more routines.");
      return;
    }
    setIsAddRoutineOpen(true);
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
    <SidebarLayout onSignOut={handleSignOut} totalTimeSaved={totalTimeSaved}>
      <div className="container mx-auto p-6 space-y-8">
        
        {/* Page Header */}
        <div className="text-center">
          <div className="clay-element w-20 h-20 gradient-clay-accent rounded-full mx-auto mb-4 flex items-center justify-center glow-jade">
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
            disabled={!isSubscribed && routines && routines.length >= 1}
            variant="clay-jade"
            size="lg"
            className="glow-jade"
          >
            <Plus className="mr-2 w-5 h-5" />
            Add New Routine
            {!isSubscribed && routines && routines.length >= 1 && " (Upgrade Required)"}
          </Button>
        </div>

        {/* Routines Grid */}
        <div className="grid gap-6">
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

        {/* Empty State */}
        {(!routines || routines.length === 0) && (
          <div className="clay-element text-center p-12">
            <div className="clay-element w-20 h-20 gradient-clay-accent rounded-full mx-auto mb-6 flex items-center justify-center glow-jade">
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
          isSubscribed={isSubscribed}
          routineCount={routines?.length || 0}
        />
      </div>
    </SidebarLayout>
  );
};

export default Routines;
