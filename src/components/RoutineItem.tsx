
import React from 'react';
import { List, Trash2, Clock } from 'lucide-react';
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

  // Calculate the total duration of all tasks in minutes
  const totalDurationMinutes = tasks.reduce((total, task) => total + task.duration, 0);
  
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
          >
            <Trash2 className="w-4 h-4 text-gray-500" />
          </Button>
        </div>
      </div>

      {(routine.start_time || tasks.length > 0) && (
        <div className="mt-2 flex flex-wrap gap-2 items-center">
          {routine.start_time && (
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-1" />
              <span>Start: {routine.start_time}</span>
              {endTime && (
                <>
                  <span className="mx-1">→</span>
                  <span>End: {endTime}</span>
                </>
              )}
            </div>
          )}
          {tasks.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {totalDurationMinutes} min total
            </Badge>
          )}
        </div>
      )}

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
