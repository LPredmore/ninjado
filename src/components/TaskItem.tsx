import React, { useState } from 'react';
import { Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from "sonner";
import EditTaskDialog from './EditTaskDialog';
import { useQueryClient } from "@tanstack/react-query";
import { invalidateRoutineQueries, queryKeys as legacyQueryKeys } from "@/lib/queryKeys";
import { queryKeys, createQueryInvalidationManager } from "@/lib/queryConfig";
import { logError } from "@/lib/errorLogger";
import type { RoutineTask } from "@/types";
import { ConfirmDialog } from "./ConfirmDialog";

interface TaskItemProps {
  task: RoutineTask;
  supabase: SupabaseClient;
  userId: string;
  index: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const TaskItem = React.memo(({ task, supabase, userId, index, onMoveUp, onMoveDown, isFirst, isLast }: TaskItemProps) => {
  const queryClient = useQueryClient();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

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
      const invalidationManager = createQueryInvalidationManager(queryClient);
      invalidationManager.invalidateRoutineQueries(userId);
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
      <div className="clay-element-draggable px-3 py-2 gradient-clay-accent mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-1 mr-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onMoveUp}
              disabled={isFirst}
              className="h-6 w-6 p-0 hover:bg-accent-foreground/10 disabled:opacity-30"
              aria-label="Move task up"
            >
              <ChevronUp className="h-4 w-4 text-accent-foreground/70" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onMoveDown}
              disabled={isLast}
              className="h-6 w-6 p-0 hover:bg-accent-foreground/10 disabled:opacity-30"
              aria-label="Move task down"
            >
              <ChevronDown className="h-4 w-4 text-accent-foreground/70" />
            </Button>
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
}, (prevProps, nextProps) => {
  // Custom equality check for TaskItem props
  return (
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.title === nextProps.task.title &&
    prevProps.task.duration === nextProps.task.duration &&
    prevProps.task.type === nextProps.task.type &&
    prevProps.userId === nextProps.userId &&
    prevProps.index === nextProps.index &&
    prevProps.isFirst === nextProps.isFirst &&
    prevProps.isLast === nextProps.isLast
  );
});

TaskItem.displayName = 'TaskItem';

export default TaskItem;
