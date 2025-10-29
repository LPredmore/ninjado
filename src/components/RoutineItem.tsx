
import React, { useState, useMemo, useEffect } from 'react';
import { List, Trash2, Clock, CalendarClock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import TaskItem from './TaskItem';
import AddTaskDialog from './AddTaskDialog';
import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import CopyRoutineDialog from './CopyRoutineDialog';
import EditRoutineDialog from './EditRoutineDialog';
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateRoutineQueries } from "@/lib/queryKeys";
import { logError } from "@/lib/errorLogger";
import { calculateEndTime, formatDuration } from "@/lib/timeUtils";
import type { RoutineTask } from "@/types";
import { ConfirmDialog } from './ConfirmDialog';

interface RoutineItemProps {
  routine: {
    id: string;
    title: string;
    start_time?: string | null;
  };
  tasks: RoutineTask[];
  onDelete: (routineId: string) => void;
  supabase: SupabaseClient;
  userId: string;
}

const RoutineItem = ({ 
  routine, 
  tasks, 
  onDelete, 
  supabase,
  userId
}: RoutineItemProps) => {
  // Local state for optimistic drag-and-drop updates
  const [localTasks, setLocalTasks] = useState(tasks);
  const queryClient = useQueryClient();
  
  // Sync tasks prop to local state when parent updates
  // This fixes the issue where tasks weren't displaying after loading
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);
  
  const handleMoveTaskUp = async (index: number) => {
    if (index === 0) return; // Already at top
    
    // Optimistic update - swap with previous task
    const items = Array.from(localTasks);
    [items[index - 1], items[index]] = [items[index], items[index - 1]];
    setLocalTasks(items);
    
    // Update positions in database
    try {
      const taskUpdates = items.map((item, idx) => ({
        id: item.id,
        position: idx,
      }));

      const { error } = await supabase.rpc("update_task_positions", {
        task_updates: taskUpdates,
      });

      if (error) throw error;
      invalidateRoutineQueries(queryClient, userId);
    } catch (error) {
      logError("Failed to move task up", error, {
        component: "RoutineItem",
        action: "handleMoveTaskUp",
        routineId: routine.id,
      });
      toast.error("Failed to move task");
      // Rollback to original order
      setLocalTasks(tasks);
    }
  };

  const handleMoveTaskDown = async (index: number) => {
    if (index === localTasks.length - 1) return; // Already at bottom
    
    // Optimistic update - swap with next task
    const items = Array.from(localTasks);
    [items[index], items[index + 1]] = [items[index + 1], items[index]];
    setLocalTasks(items);
    
    // Update positions in database
    try {
      const taskUpdates = items.map((item, idx) => ({
        id: item.id,
        position: idx,
      }));

      const { error } = await supabase.rpc("update_task_positions", {
        task_updates: taskUpdates,
      });

      if (error) throw error;
      invalidateRoutineQueries(queryClient, userId);
    } catch (error) {
      logError("Failed to move task down", error, {
        component: "RoutineItem",
        action: "handleMoveTaskDown",
        routineId: routine.id,
      });
      toast.error("Failed to move task");
      // Rollback to original order
      setLocalTasks(tasks);
    }
  };

  // Calculate the total duration of all tasks in minutes (memoized)
  const totalDurationMinutes = useMemo(
    () => localTasks.reduce((total, task) => total + task.duration, 0),
    [localTasks]
  );
  
  // Calculate the end time if start time is set (memoized)
  const endTime = useMemo(() => {
    return calculateEndTime(routine.start_time || null, totalDurationMinutes);
  }, [routine.start_time, totalDurationMinutes]);
  
  return (
    <div className="clay-element-with-transition p-3 md:p-4 bg-card border-2 border-border/30 clay-hover hover:border-accent/30 max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <List className="w-4 h-4 md:w-5 md:h-5 text-accent shrink-0" />
          <span className="font-medium text-sm md:text-base text-card-foreground break-words">{routine.title}</span>
          <Badge variant="outline" className="clay-element-with-transition bg-primary/20 text-primary border-primary/30 text-xs">
            {localTasks.length} task{localTasks.length !== 1 ? 's' : ''}
          </Badge>
          <EditRoutineDialog 
            routineId={routine.id} 
            routineTitle={routine.title}
            routineStartTime={routine.start_time || undefined}
            supabase={supabase}
            userId={userId}
          />
        </div>
        <div className="flex items-center space-x-2">
          <CopyRoutineDialog
            routineId={routine.id}
            routineTitle={routine.title}
            routineStartTime={routine.start_time || undefined}
            supabase={supabase}
            userId={userId}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(routine.id);
            }}
            className="hover:bg-destructive/20 hover:text-destructive"
          >
            <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
          </Button>
        </div>
      </div>

      <div className="mt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex flex-wrap gap-1.5 md:gap-2 items-center">
            {localTasks.length > 0 ? (
              <>
                <Badge variant="success" className="text-xs">
                  {formatDuration(totalDurationMinutes)}
                </Badge>
                <Badge variant="speed" className="text-xs">
                  {localTasks.filter(t => t.type === 'regular').length} speed
                </Badge>
                <Badge variant="focus" className="text-xs">
                  {localTasks.filter(t => t.type === 'focus').length} focus
                </Badge>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">No tasks yet</span>
            )}
          </div>
        
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center w-full sm:w-auto">
          {routine.start_time ? (
            <div className="clay-element-with-transition px-2 md:px-3 py-1.5 md:py-2 gradient-clay-primary">
              <div className="flex items-center">
                <Clock className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2 text-primary-foreground shrink-0" />
                <span className="text-xs md:text-sm font-medium text-primary-foreground truncate">Start: {routine.start_time}</span>
              </div>
            </div>
          ) : (
            <div className="clay-element-with-transition px-2 md:px-3 py-1.5 md:py-2 bg-muted/50">
              <div className="flex items-center">
                <Clock className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2 text-muted-foreground shrink-0" />
                <span className="text-xs md:text-sm text-muted-foreground">No start time</span>
              </div>
            </div>
          )}
          
          {endTime && endTime !== "N/A" ? (
            <div className="clay-element-with-transition px-2 md:px-3 py-1.5 md:py-2 gradient-clay-accent">
              <div className="flex items-center">
                <CalendarClock className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2 text-accent-foreground shrink-0" />
                <span className="text-xs md:text-sm font-medium text-accent-foreground truncate">End: {endTime}</span>
              </div>
            </div>
          ) : (
            <div className="clay-element-with-transition px-2 md:px-3 py-1.5 md:py-2 bg-muted/50">
              <div className="flex items-center">
                <CalendarClock className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2 text-muted-foreground shrink-0" />
                <span className="text-xs md:text-sm text-muted-foreground">Set start time</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-2" onClick={(e) => e.stopPropagation()}>
        <div className="min-h-[50px] space-y-2">
          {localTasks.length === 0 ? (
            <div className="clay-element-with-transition p-4 text-center text-muted-foreground text-sm">
              No tasks yet. Add your first task below!
            </div>
          ) : (
            localTasks.map((task, index) => (
              <TaskItem
                key={task.id}
                task={task}
                supabase={supabase}
                userId={userId}
                index={index}
                onMoveUp={() => handleMoveTaskUp(index)}
                onMoveDown={() => handleMoveTaskDown(index)}
                isFirst={index === 0}
                isLast={index === localTasks.length - 1}
              />
            ))
          )}
        </div>

        <AddTaskDialog
          routineId={routine.id}
          routineTitle={routine.title}
          tasksCount={localTasks.length}
          supabase={supabase}
          userId={userId}
        />
      </div>
    </div>
  );
};

export default RoutineItem;
