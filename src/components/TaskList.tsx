
import React from 'react';
import TaskCard from './TaskCard';
import { Task } from '@/types';
import { Button } from './ui/button';
import { SkipForwardIcon, Plus, GripVertical } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useParentalControls } from '@/hooks/useParentalControls';
import PinPrompt from '@/components/PinPrompt';

interface TaskListProps {
  tasks: Task[];
  onTaskComplete: (taskId: string, timeSaved: number) => void;
  isRoutineStarted: boolean;
  isPaused?: boolean;
  onTaskReorder: (tasks: Task[]) => void;
  userId: string;
}

const TaskList = ({ 
  tasks,
  onTaskComplete,
  isRoutineStarted,
  isPaused,
  onTaskReorder,
  userId
}: TaskListProps) => {
  const [localTasks, setLocalTasks] = React.useState<Task[]>(tasks);
  const [newTaskTitle, setNewTaskTitle] = React.useState('');
  const [newTaskDuration, setNewTaskDuration] = React.useState('');
  const [showAddDialog, setShowAddDialog] = React.useState(false);
  const { isPinPromptOpen, requestAccess, handlePinSuccess, handlePinCancel } = useParentalControls(userId);

  // Update local tasks when parent tasks change
  React.useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const handleSkipTask = (taskId: string) => {
    const newTasks = localTasks.filter(task => task.id !== taskId);
    setLocalTasks(newTasks);
    onTaskReorder(newTasks);
    toast.success('Task skipped');
  };

  const handleAddTemporaryTask = () => {
    if (!newTaskTitle.trim() || !newTaskDuration.trim()) {
      toast.error('Please fill in all task details');
      return;
    }

    const newTask: Task = {
      id: `temp-${Date.now()}`,
      title: newTaskTitle,
      duration: parseInt(newTaskDuration),
      isActive: false,
      isCompleted: false,
      type: 'regular'
    };

    const updatedTasks = [...localTasks, newTask];
    setLocalTasks(updatedTasks);
    onTaskReorder(updatedTasks);
    setNewTaskTitle('');
    setNewTaskDuration('');
    setShowAddDialog(false);
    toast.success('Temporary task added');
  };

  const handlePinSuccessForAddTask = () => {
    setShowAddDialog(true);
    handlePinSuccess();
  };

  const handleDragEnd = (result: any) => {
    // Dropped outside the list
    if (!result.destination) {
      return;
    }

    const items = Array.from(localTasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setLocalTasks(items);
    onTaskReorder(items);
  };

  return (
    <div className="space-y-4">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="tasks-list">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-4"
            >
              {localTasks.map((task, index) => (
                <Draggable 
                  key={task.id} 
                  draggableId={task.id} 
                  index={index}
                  isDragDisabled={isRoutineStarted}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`relative group ${snapshot.isDragging ? 'z-50' : ''}`}
                    >
                      <div className="flex">
                        {!isRoutineStarted && (
                          <div 
                            {...provided.dragHandleProps}
                            className="flex items-center px-2 cursor-grab active:cursor-grabbing"
                          >
                            <GripVertical className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <TaskCard
                            task={task}
                            onComplete={(timeSaved) => onTaskComplete(task.id, timeSaved)}
                            onEdit={() => {}}
                            onDelete={() => {}}
                            isRoutineStarted={isRoutineStarted}
                            isPaused={isPaused}
                          />
                        </div>
                      </div>
                      {!isRoutineStarted && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleSkipTask(task.id)}
                            className="bg-white/90 hover:bg-white"
                          >
                            <SkipForwardIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {!isRoutineStarted && (
        <>
          <Button 
            className="w-full mt-4" 
            variant="outline"
            onClick={() => requestAccess(() => setShowAddDialog(true))}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Temporary Task
          </Button>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Temporary Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium">Task Name</label>
                  <Input
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Enter task name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Duration (minutes)</label>
                  <Input
                    type="number"
                    value={newTaskDuration}
                    onChange={(e) => setNewTaskDuration(e.target.value)}
                    placeholder="Enter duration"
                    min="1"
                    className="mt-1"
                  />
                </div>
                <Button onClick={handleAddTemporaryTask} className="w-full">
                  Add Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
      
      <PinPrompt
        isOpen={isPinPromptOpen}
        onClose={handlePinCancel}
        onSuccess={handlePinSuccessForAddTask}
        title="Task Management Security"
        description="Adding temporary tasks requires parental authorization."
        userId={userId}
      />
    </div>
  );
};

export default TaskList;
