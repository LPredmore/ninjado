
import React from 'react';
import { Trash2, GripVertical } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from "sonner";
import { Draggable } from 'react-beautiful-dnd';
import EditTaskDialog from './EditTaskDialog';
import { useQueryClient } from "@tanstack/react-query";
import { invalidateRoutineQueries, queryKeys } from "@/lib/queryKeys";
import { logError } from "@/lib/errorLogger";
import type { RoutineTask } from "@/types";
import { ConfirmDialog } from "./ConfirmDialog";

interface TaskItemProps {
  task: RoutineTask;
  supabase: SupabaseClient;
  userId: string;
  index: number;
}

const TaskItem = ({ task, supabase, userId, index }: TaskItemProps) => {
  const queryClient = useQueryClient();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);

  const handleDelete = async () => {
    // Optimistic update - get current tasks from cache
    const previousTasks = queryClient.getQueryData(queryKeys.allRoutineTasks(userId));
    
    // Remove task from UI immediately
    queryClient.setQueryData(
      queryKeys.allRoutineTasks(userId),
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
      queryClient.setQueryData(queryKeys.allRoutineTasks(userId), previousTasks);
      
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
    <>
      <Draggable draggableId={task.id} index={index}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            style={{
              ...provided.draggableProps.style,
              transform: provided.draggableProps.style?.transform 
                ? `${provided.draggableProps.style.transform} scale(1.02)`
                : undefined,
            }}
            className="clay-element-draggable px-3 py-2 gradient-clay-accent mb-2 flex items-center justify-between transition-transform hover:scale-105"
          >
            <div className="flex items-center gap-2">
            <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing mr-2" aria-label="Drag to reorder">
              <GripVertical className="h-5 w-5 text-accent-foreground/70" />
            </div>
              <span className="text-sm font-medium text-accent-foreground">{task.title}</span>
              {task.type === 'focus' ? (
                <Badge variant="focus" className="text-xs">
                  Focus
                </Badge>
              ) : (
                <Badge variant="speed" className="text-xs">
                  Speed
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
                onClick={() => setDeleteConfirmOpen(true)}
                className="h-8 w-8 text-accent-foreground/70 hover:text-accent-foreground hover:bg-accent-foreground/10"
                aria-label="Delete task"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Draggable>
      
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Task"
        description={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  );
};

export default TaskItem;
