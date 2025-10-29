
import React from 'react';
import { Trash2, GripVertical } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from "sonner";
import { Draggable } from 'react-beautiful-dnd';
import EditTaskDialog from './EditTaskDialog';

interface TaskItemProps {
  task: {
    id: string;
    title: string;
    duration: number;
    position: number;
    type?: 'regular' | 'focus';
  };
  isFirst: boolean;
  isLast: boolean;
  onTaskUpdate: () => void;
  supabase: SupabaseClient;
  index: number;
}

const TaskItem = ({ task, onTaskUpdate, supabase, index }: TaskItemProps) => {
  const handleDelete = async () => {
    const { error } = await supabase
      .from('routine_tasks')
      .delete()
      .eq('id', task.id);

    if (error) {
      toast.error('Failed to delete task');
      return;
    }

    onTaskUpdate();
    toast.success('Task deleted successfully');
  };

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`clay-element px-3 py-2 gradient-clay-accent mb-2 flex items-center justify-between transition-all ${
            snapshot.isDragging ? 'opacity-50 rotate-2 scale-105' : 'opacity-100'
          }`}
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
              onEditComplete={onTaskUpdate}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="h-8 w-8 text-accent-foreground/70 hover:text-accent-foreground hover:bg-accent-foreground/10"
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
