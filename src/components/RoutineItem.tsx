
import React, { useState, useEffect } from 'react';
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

interface RoutineItemProps {
  routine: {
    id: string;
    title: string;
    start_time?: string | null;
  };
  tasks: {
    id: string;
    title: string;
    duration: number;
    position: number;
    type?: 'regular' | 'focus';
  }[];
  onDelete: (routineId: string) => void;
  supabase: SupabaseClient;
  onTasksUpdate: () => void;
}

const RoutineItem = ({ 
  routine, 
  tasks, 
  onDelete, 
  supabase, 
  onTasksUpdate
}: RoutineItemProps) => {
  // Local state for optimistic updates
  const [localTasks, setLocalTasks] = useState(tasks);
  
  // Sync local tasks with prop changes
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
    
    // Update positions in database using parallel requests
    try {
      const updatePromises = items.map((item, index) => 
        supabase
          .from('routine_tasks')
          .update({ position: index })
          .eq('id', item.id)
      );
      
      await Promise.all(updatePromises);
      onTasksUpdate();
    } catch (error) {
      console.error("Error updating task positions:", error);
      toast.error("Failed to update task positions");
      // Revert optimistic update on error
      setLocalTasks(tasks);
    }
  };

  // Calculate the total duration of all tasks in minutes
  const totalDurationMinutes = localTasks.reduce((total, task) => total + task.duration, 0);
  
  // Calculate the end time if start time is set
  const calculateEndTime = () => {
    if (!routine.start_time) return null;
    
    const [hours, minutes] = routine.start_time.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0);
    
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + totalDurationMinutes);
    
    return endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const endTime = calculateEndTime();
  
  return (
    <div className="clay-element p-4 bg-card border-2 border-border/30 transition-clay clay-hover hover:border-accent/30">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <List className="w-5 h-5 text-accent" />
          <span className="font-medium text-card-foreground">{routine.title}</span>
          <Badge variant="outline" className="clay-element bg-primary/20 text-primary border-primary/30 text-xs">
            {localTasks.length} task{localTasks.length !== 1 ? 's' : ''}
          </Badge>
          <EditRoutineDialog 
            routineId={routine.id} 
            routineTitle={routine.title}
            routineStartTime={routine.start_time || undefined}
            supabase={supabase} 
            onEditComplete={onTasksUpdate}
          />
        </div>
        <div className="flex items-center space-x-2">
          <CopyRoutineDialog
            routineId={routine.id}
            routineTitle={routine.title}
            supabase={supabase}
            onCopyComplete={onTasksUpdate}
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
          {localTasks.length > 0 && (
            <Badge variant="outline" className="clay-element bg-accent/20 text-accent border-accent/30 text-xs">
              {totalDurationMinutes} min total
            </Badge>
          )}
        </div>
        
        <div className="flex gap-4 items-center">
          {routine.start_time ? (
            <div className="clay-element px-3 py-2 gradient-clay-primary">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-primary-foreground" />
                <span className="text-sm font-medium text-primary-foreground">Start: {routine.start_time}</span>
              </div>
            </div>
          ) : (
            <div className="clay-element px-3 py-2 bg-muted/50">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">No start time</span>
              </div>
            </div>
          )}
          
          {endTime ? (
            <div className="clay-element px-3 py-2 gradient-clay-accent">
              <div className="flex items-center">
                <CalendarClock className="w-4 h-4 mr-2 text-accent-foreground" />
                <span className="text-sm font-medium text-accent-foreground">End: {endTime}</span>
              </div>
            </div>
          ) : (
            <div className="clay-element px-3 py-2 bg-muted/50">
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
              >
                {localTasks.map((task, index) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    isFirst={index === 0}
                    isLast={index === localTasks.length - 1}
                    onTaskUpdate={onTasksUpdate}
                    supabase={supabase}
                    index={index}
                  />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <AddTaskDialog
          routineId={routine.id}
          routineTitle={routine.title}
          tasksCount={localTasks.length}
          onTasksUpdate={onTasksUpdate}
          supabase={supabase}
        />
      </div>
    </div>
  );
};

export default RoutineItem;
