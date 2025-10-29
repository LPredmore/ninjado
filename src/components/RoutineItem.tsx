
import React, { useState, useMemo, useEffect } from 'react';
import { List, Trash2, Clock, CalendarClock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import TaskItem from './TaskItem';
import AddTaskDialog from './AddTaskDialog';
import { SupabaseClient } from '@supabase/supabase-js';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
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
  
  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;
    
    // Optimistic update - update UI immediately
    const items = Array.from(localTasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setLocalTasks(items);
    
    // Update positions in database using batch RPC
    try {
      const taskUpdates = items.map((item, index) => ({
        id: item.id,
        position: index,
      }));

      const { error } = await supabase.rpc("update_task_positions", {
        task_updates: taskUpdates,
      });

      if (error) throw error;
      invalidateRoutineQueries(queryClient, userId);
    } catch (error) {
      logError("Failed to reorder tasks", error, {
        component: "RoutineItem",
        action: "handleDragEnd",
        routineId: routine.id,
      });
      toast.error("Failed to reorder tasks");
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
    <div className="clay-element-with-transition p-4 bg-card border-2 border-border/30 clay-hover hover:border-accent/30">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <List className="w-5 h-5 text-accent" />
          <span className="font-medium text-card-foreground">{routine.title}</span>
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

      <div className="mt-3 flex justify-between items-center">
          <div className="flex flex-wrap gap-2 items-center">
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
        
        <div className="flex gap-4 items-center">
          {routine.start_time ? (
            <div className="clay-element-with-transition px-3 py-2 gradient-clay-primary">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-primary-foreground" />
                <span className="text-sm font-medium text-primary-foreground">Start: {routine.start_time}</span>
              </div>
            </div>
          ) : (
            <div className="clay-element-with-transition px-3 py-2 bg-muted/50">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">No start time</span>
              </div>
            </div>
          )}
          
          {endTime && endTime !== "N/A" ? (
            <div className="clay-element-with-transition px-3 py-2 gradient-clay-accent">
              <div className="flex items-center">
                <CalendarClock className="w-4 h-4 mr-2 text-accent-foreground" />
                <span className="text-sm font-medium text-accent-foreground">End: {endTime}</span>
              </div>
            </div>
          ) : (
            <div className="clay-element-with-transition px-3 py-2 bg-muted/50">
              <div className="flex items-center">
                <CalendarClock className="w-4 h-4 mr-2 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Set start time</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-2" onClick={(e) => e.stopPropagation()}>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId={`routine-${routine.id}`}>
            {(provided) => (
            <div 
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="min-h-[50px] space-y-2"
            >
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
                  />
                ))
              )}
              {provided.placeholder}
            </div>
            )}
          </Droppable>
        </DragDropContext>

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
