
import React from 'react';
import { List, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import TaskItem from './TaskItem';
import AddTaskDialog from './AddTaskDialog';
import { SupabaseClient } from '@supabase/supabase-js';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { toast } from 'sonner';

interface RoutineItemProps {
  routine: {
    id: string;
    title: string;
  };
  tasks: {
    id: string;
    title: string;
    duration: number;
    position: number;
  }[];
  onDelete: (routineId: string) => void;
  supabase: SupabaseClient;
  onTasksUpdate: () => void;
  isSelected: boolean;
  onSelect: () => void;
}

const RoutineItem = ({ 
  routine, 
  tasks, 
  onDelete, 
  supabase, 
  onTasksUpdate,
  isSelected,
  onSelect
}: RoutineItemProps) => {
  
  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;
    
    const items = Array.from(tasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update positions in database
    try {
      for (let i = 0; i < items.length; i++) {
        await supabase
          .from('routine_tasks')
          .update({ position: i })
          .eq('id', items[i].id);
      }
      onTasksUpdate();
    } catch (error) {
      toast.error('Failed to update task positions');
    }
  };
  
  return (
    <div
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
        isSelected
          ? 'border-ninja-primary bg-ninja-primary/10'
          : 'border-gray-200 hover:border-ninja-primary/50'
      }`}
      onClick={onSelect}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <List className="w-5 h-5 text-ninja-primary" />
          <span className="font-medium">{routine.title}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(routine.id);
          }}
        >
          <Trash2 className="w-4 h-4 text-gray-500" />
        </Button>
      </div>

      <div className="mt-4 space-y-2" onClick={(e) => e.stopPropagation()}>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId={`routine-${routine.id}`}>
            {(provided) => (
              <div 
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {tasks.map((task, index) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    isFirst={index === 0}
                    isLast={index === tasks.length - 1}
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
          tasksCount={tasks.length}
          onTasksUpdate={onTasksUpdate}
          supabase={supabase}
        />
      </div>
    </div>
  );
};

export default RoutineItem;
