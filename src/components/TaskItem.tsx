
import React from 'react';
import { Trash2, GripVertical } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from "sonner";
import { Draggable } from 'react-beautiful-dnd';
import EditTaskDialog from './EditTaskDialog';
import { useQueryClient } from "@tanstack/react-query";
import { invalidateRoutineQueries } from "@/lib/queryKeys";
import { logError } from "@/lib/errorLogger";
import type { RoutineTask } from "@/types";

interface TaskItemProps {
  task: RoutineTask;
  supabase: SupabaseClient;
  userId: string;
  index: number;
}

const TaskItem = ({ task, supabase, userId, index }: TaskItemProps) => {
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    // Optimistic update - get current tasks from cache
    const previousTasks = queryClient.getQueryData(['routines', 'tasks', userId]);
    
    // Remove task from UI immediately
    queryClient.setQueryData(
      ['routines', 'tasks', userId],
      (old: any) => old?.filter((t: any) => t.id !== task.id) || []
    );

    try {
      const { error } = await supabase
        .from('routine_tasks')
        .delete()
        .eq('id', task.id);

      if (error) throw error;

      toast.success('Task deleted');
      invalidateRoutineQueries(queryClient, userId);
    } catch (error) {
      // Rollback on error
      queryClient.setQueryData(['routines', 'tasks', userId], previousTasks);
      
      logError('Failed to delete task', error, {
        component: 'TaskItem',
        action: 'handleDelete',
        taskId: task.id,
      });
      
      toast.error('Failed to delete task', {
        action: {
          label: "Retry",
          onClick: handleDelete,
        },
      });
    }
  };

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={provided.draggableProps.style}
          className="clay-element-draggable px-3 py-2 gradient-clay-accent mb-2 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing mr-2">
              <GripVertical className="h-5 w-5 text-accent-foreground/70" />
            </div>
            <span className="text-sm font-medium text-accent-foreground">{task.title}</span>
            {task.type === 'focus' && (
              <Badge variant="secondary" className="bg-accent-foreground/20 text-accent-foreground border-accent-foreground/30">
                Focus
              </Badge>
            )}
            <span className="text-sm text-accent-foreground/70">({task.duration} min)</span>
          </div>
          
          <div className="flex items-center gap-2">
            <EditTaskDialog
              taskId={task.id}
              task={task}
              supabase={supabase}
              userId={userId}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="h-8 w-8 text-accent-foreground/70 hover:text-accent-foreground hover:bg-accent-foreground/10"
              aria-label="Delete task"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default TaskItem;
