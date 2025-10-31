
import React from 'react';
import TaskCard from './TaskCard';
import { Task } from '@/types';
import { Button } from './ui/button';
import { SkipForwardIcon, Plus, ChevronUp, ChevronDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { toast } from 'sonner';
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

const TaskList = React.memo(({ 
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

  const handleMoveTaskUp = (index: number) => {
    if (index === 0) return;
    const items = Array.from(localTasks);
    [items[index - 1], items[index]] = [items[index], items[index - 1]];
    setLocalTasks(items);
    onTaskReorder(items);
    toast.success('Task moved up');
  };

  const handleMoveTaskDown = (index: number) => {
    if (index === localTasks.length - 1) return;
    const items = Array.from(localTasks);
    [items[index], items[index + 1]] = [items[index + 1], items[index]];
    setLocalTasks(items);
    onTaskReorder(items);
    toast.success('Task moved down');
  };

  return (
    <div className="space-y-4 max-w-full overflow-hidden">
      <div className="space-y-4">
        {localTasks.map((task, index) => (
          <div key={task.id} className="relative group max-w-full">
            <div className="flex gap-2 max-w-full">
              {!isRoutineStarted && (
                <div className="flex flex-col gap-1 pt-4 md:pt-6 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMoveTaskUp(index)}
                    disabled={index === 0}
                    className="h-6 w-6 md:h-8 md:w-8"
                  >
                    <ChevronUp className="h-3 w-3 md:h-4 md:w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMoveTaskDown(index)}
                    disabled={index === localTasks.length - 1}
                    className="h-6 w-6 md:h-8 md:w-8"
                  >
                    <ChevronDown className="h-3 w-3 md:h-4 md:w-4" />
                  </Button>
                </div>
              )}
              <div className="flex-1 min-w-0">
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
        ))}
      </div>

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
}, (prevProps, nextProps) => {
  // Custom equality check for TaskList props
  return (
    prevProps.isRoutineStarted === nextProps.isRoutineStarted &&
    prevProps.isPaused === nextProps.isPaused &&
    prevProps.userId === nextProps.userId &&
    prevProps.tasks.length === nextProps.tasks.length &&
    prevProps.tasks.every((task, index) => 
      task.id === nextProps.tasks[index]?.id &&
      task.title === nextProps.tasks[index]?.title &&
      task.duration === nextProps.tasks[index]?.duration &&
      task.isCompleted === nextProps.tasks[index]?.isCompleted &&
      task.isActive === nextProps.tasks[index]?.isActive &&
      task.type === nextProps.tasks[index]?.type
    )
  );
});

TaskList.displayName = 'TaskList';

export default TaskList;
