import React from 'react';
import { ArrowUpIcon, ArrowDownIcon, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from "sonner";

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
}

const TaskItem = ({ task, isFirst, isLast, onTaskUpdate, supabase }: TaskItemProps) => {
  const handleMove = async (direction: 'up' | 'down') => {
    const newPosition = direction === 'up' ? task.position - 1 : task.position + 1;
    
    const { error } = await supabase
      .from('routine_tasks')
      .update({ position: task.position })
      .eq('position', newPosition);

    if (error) {
      toast.error('Failed to move task');
      return;
    }

    const { error: error2 } = await supabase
      .from('routine_tasks')
      .update({ position: newPosition })
      .eq('id', task.id);

    if (error2) {
      toast.error('Failed to move task');
      return;
    }

    onTaskUpdate();
  };

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
    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center gap-2">
        <span className="font-medium">{task.title}</span>
        {task.type === 'focus' && (
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            Focus
          </Badge>
        )}
        <span className="text-sm text-gray-500">({task.duration} min)</span>
      </div>
      
      <div className="flex items-center gap-2">
        {!isFirst && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleMove('up')}
            className="h-8 w-8"
          >
            <ArrowUpIcon className="h-4 w-4" />
          </Button>
        )}
        {!isLast && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleMove('down')}
            className="h-8 w-8"
          >
            <ArrowDownIcon className="h-4 w-4" />
          </Button>
        )}
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
  );
};

export default TaskItem;