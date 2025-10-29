import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import SidebarLayout from '@/components/SidebarLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { TrendingUp, TrendingDown, Target, RotateCcw, RefreshCw, Info } from 'lucide-react';
import { toast } from 'sonner';
import { getAllTaskPerformanceMetrics, resetTaskPerformanceMetrics } from '@/lib/taskPerformance';
import { queryKeys } from '@/lib/queryKeys';
import { RoutineTask } from '@/types';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useEffect } from 'react';

const Reports = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);
  const queryClient = useQueryClient();

  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery({
    queryKey: ['task-performance-metrics', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await getAllTaskPerformanceMetrics(user.id);
    },
    enabled: !!user,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });

  const { data: tasks, isLoading: tasksLoading, refetch } = useQuery({
    queryKey: user?.id ? queryKeys.allRoutineTasks(user.id) : ['all-routine-tasks'],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('routine_tasks')
        .select('*, routines!inner(user_id)')
        .eq('routines.user_id', user.id);

      if (error) throw error;
      return data as RoutineTask[];
    },
    enabled: !!user,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleRefreshData = async () => {
    if (!user) return;
    
    try {
      // Clear React Query cache for this page
      await queryClient.invalidateQueries({ queryKey: ['task-performance-metrics'] });
      await queryClient.invalidateQueries({ queryKey: queryKeys.allRoutineTasks(user.id) });
      
      // Force refetch with no cache
      await refetchMetrics();
      await refetch();
      
      toast.success('Data refreshed!');
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh data');
    }
  };

  const handleResetMetric = async (taskId: string) => {
    if (!user) return;
    
    try {
      await resetTaskPerformanceMetrics(taskId, user.id);
      await refetchMetrics();
      toast.success('Task performance reset successfully');
    } catch (error) {
      console.error('Error resetting task performance:', error);
      toast.error('Failed to reset task performance');
    }
  };

  const enrichedMetrics = metrics?.map(metric => {
    const task = tasks?.find(t => t.id === metric.task_id);
    return {
      ...metric,
      taskTitle: task?.title || 'Unknown Task',
      taskDuration: task?.duration || 0,
    };
  }).filter(m => m.total_executions > 0);

  // Debug logging
  useEffect(() => {
    console.log('[Reports Debug] Metrics:', metrics);
    console.log('[Reports Debug] Tasks:', tasks);
    console.log('[Reports Debug] Enriched:', enrichedMetrics);
  }, [metrics, tasks, enrichedMetrics]);

  const formatTime = (seconds: number) => {
    const absSeconds = Math.abs(seconds);
    if (absSeconds < 60) return `${absSeconds}s`;
    const minutes = Math.floor(absSeconds / 60);
    const secs = absSeconds % 60;
    if (secs === 0) return `${minutes}m`;
    return `${minutes}m ${secs}s`;
  };

  const isLoading = metricsLoading || tasksLoading;

  return (
    <ErrorBoundary>
      <SidebarLayout onSignOut={handleSignOut} totalTimeSaved={0}>
        <div className="space-y-6 p-4 md:p-6 max-w-full overflow-hidden">
          
          <div className="clay-element-with-transition p-6">
            <div className="flex items-center justify-between gap-4 mb-2">
              <div className="flex items-center gap-4">
                <div className="clay-element-with-transition w-12 h-12 gradient-clay-primary rounded-xl flex items-center justify-center">
                  📊
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Performance Reports</h1>
                  <p className="text-muted-foreground">Track your task completion efficiency</p>
                </div>
              </div>
              <Button onClick={handleRefreshData} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Data
              </Button>
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>First time here?</AlertTitle>
            <AlertDescription>
              If you don't see your data, try clicking the "Refresh Data" button above, or hard reload (Ctrl+Shift+R or Cmd+Shift+R).
            </AlertDescription>
          </Alert>

          {isLoading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading performance data...</p>
            </div>
          )}

          {!isLoading && (!enrichedMetrics || enrichedMetrics.length === 0) && (
            <Card className="p-12 text-center clay-element">
              <div className="text-6xl mb-4">📈</div>
              <h3 className="text-xl font-semibold mb-2">No Performance Data Yet</h3>
              <p className="text-muted-foreground">
                Complete some tasks to start tracking your performance metrics!
              </p>
            </Card>
          )}

          {!isLoading && enrichedMetrics && enrichedMetrics.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {enrichedMetrics.map((metric) => {
                const isAhead = metric.average_time_variance > 0;
                const isBehind = metric.average_time_variance < 0;
                const isOnTrack = metric.average_time_variance === 0;

                return (
                  <Card key={metric.id} className="p-6 clay-element-with-transition hover:shadow-lg transition-shadow">
                    <div className="mb-4">
                      <h3 className="font-semibold text-lg break-words line-clamp-2">
                        {metric.taskTitle}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Expected: {metric.taskDuration} minutes
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      {isAhead && (
                        <>
                          <TrendingUp className="w-5 h-5 text-green-600" />
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                            {formatTime(metric.average_time_variance)} faster
                          </Badge>
                        </>
                      )}
                      {isBehind && (
                        <>
                          <TrendingDown className="w-5 h-5 text-amber-600" />
                          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                            {formatTime(Math.abs(metric.average_time_variance))} slower
                          </Badge>
                        </>
                      )}
                      {isOnTrack && (
                        <>
                          <Target className="w-5 h-5 text-blue-600" />
                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                            On target
                          </Badge>
                        </>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground mb-4">
                      Completed {metric.total_executions} {metric.total_executions === 1 ? 'time' : 'times'}
                    </p>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="w-full"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Reset Average
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Reset Performance Data?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will reset the performance metrics for "{metric.taskTitle}" back to zero.
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleResetMetric(metric.task_id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Reset
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </Card>
                );
              })}
            </div>
          )}

        </div>
      </SidebarLayout>
    </ErrorBoundary>
  );
};

export default Reports;
