
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
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 mb-2"
        >
          <div className="flex items-center gap-2">
            <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing mr-2">
              <GripVertical className="h-5 w-5 text-gray-400" />
            </div>
            <span className="font-medium">{task.title}</span>
            {task.type === 'focus' && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                Focus
              </Badge>
            )}
            <span className="text-sm text-gray-500">({task.duration} min)</span>
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
              className="h-8 w-8 text-red-500 hover:text-red-600"
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
