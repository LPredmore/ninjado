import React, { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { User, SupabaseClient } from '@supabase/supabase-js';
import TaskList from '@/components/TaskList';
import { useToast } from '@/components/ui/use-toast';
import TaskDialog from '@/components/TaskDialog';
import Header from '@/components/Header';
import RoutineProgress from '@/components/RoutineProgress';
import TimeTracker from '@/components/TimeTracker';
import { useQuery } from '@tanstack/react-query';

interface IndexProps {
  user: User;
  supabase: SupabaseClient;
}

interface Task {
  id: string;
  title: string;
  duration: number;
  isActive: boolean;
  isCompleted: boolean;
}

const Index = ({ user, supabase }: IndexProps) => {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Get out of bed', duration: 2, isActive: false, isCompleted: false },
    { id: '2', title: 'Brush teeth', duration: 3, isActive: false, isCompleted: false },
    { id: '3', title: 'Get dressed', duration: 5, isActive: false, isCompleted: false },
    { id: '4', title: 'Pack backpack', duration: 3, isActive: false, isCompleted: false },
  ]);
  const [isRoutineStarted, setIsRoutineStarted] = useState(false);
  const [activeTaskIndex, setActiveTaskIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const { toast } = useToast();

  // Task editing state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDuration, setNewTaskDuration] = useState('');

  // Fetch total time saved
  const { data: totalTimeSaved = 0 } = useQuery({
    queryKey: ['totalTimeSaved', user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_completions')
        .select('time_saved')
        .eq('user_id', user.id);

      if (error) throw error;
      return data.reduce((total, record) => total + record.time_saved, 0);
    },
  });

  useEffect(() => {
    let timer: number;
    if (isRoutineStarted && timeLeft > 0) {
      timer = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRoutineStarted, timeLeft]);

  const startRoutine = () => {
    setIsRoutineStarted(true);
    setTasks((prev) =>
      prev.map((task, index) => ({
        ...task,
        isActive: index === 0,
        isCompleted: false,
      }))
    );
    setActiveTaskIndex(0);
    setTimeLeft(tasks[0].duration * 60);
  };

  const handleTaskComplete = async (taskId: string) => {
    const currentTask = tasks[activeTaskIndex];
    const timeSaved = (currentTask.duration * 60) - (currentTask.duration * 60 - timeLeft);
    
    // Save completion to database
    const { error } = await supabase
      .from('task_completions')
      .insert({
        user_id: user.id,
        task_title: currentTask.title,
        time_saved: timeSaved,
      });

    if (error) {
      console.error('Error saving task completion:', error);
      toast({
        title: "Error",
        description: "Failed to save task completion.",
        variant: "destructive",
      });
      return;
    }

    const newTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, isCompleted: true, isActive: false } : task
    );
    
    const nextTaskIndex = activeTaskIndex + 1;
    
    if (nextTaskIndex < tasks.length) {
      newTasks[nextTaskIndex].isActive = true;
      setTimeLeft(tasks[nextTaskIndex].duration * 60);
      setActiveTaskIndex(nextTaskIndex);
    } else {
      setIsRoutineStarted(false);
      toast({
        title: "Congratulations!",
        description: "You've completed all your tasks! Great job!",
      });
    }
    
    setTasks(newTasks);
  };

  const handleAddTask = () => {
    if (newTaskTitle && newTaskDuration) {
      const newTask: Task = {
        id: Date.now().toString(),
        title: newTaskTitle,
        duration: parseInt(newTaskDuration),
        isActive: false,
        isCompleted: false,
      };
      setTasks([...tasks, newTask]);
      setNewTaskTitle('');
      setNewTaskDuration('');
      toast({
        title: "Task Added",
        description: "New task has been added to your routine!",
      });
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setNewTaskTitle(task.title);
    setNewTaskDuration(task.duration.toString());
  };

  const handleUpdateTask = () => {
    if (editingTask && newTaskTitle && newTaskDuration) {
      setTasks(tasks.map(task => 
        task.id === editingTask.id 
          ? { ...task, title: newTaskTitle, duration: parseInt(newTaskDuration) }
          : task
      ));
      setEditingTask(null);
      setNewTaskTitle('');
      setNewTaskDuration('');
      toast({
        title: "Task Updated",
        description: "Task has been successfully updated!",
      });
    }
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
    toast({
      title: "Task Deleted",
      description: "Task has been removed from your routine.",
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const completedTasks = tasks.filter((task) => task.isCompleted).length;

  return (
    <div className="min-h-screen bg-ninja-background p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <Header onSignOut={handleSignOut} />
        <TimeTracker totalTimeSaved={totalTimeSaved} />

        <div className="bg-white rounded-2xl p-6 shadow-lg space-y-6">
          <RoutineProgress
            completedTasks={completedTasks}
            totalTasks={tasks.length}
            isRoutineStarted={isRoutineStarted}
            onStartRoutine={startRoutine}
          />

          <TaskList
            tasks={tasks}
            activeTaskIndex={activeTaskIndex}
            timeLeft={timeLeft}
            onTaskComplete={handleTaskComplete}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            isRoutineStarted={isRoutineStarted}
          />

          {!isRoutineStarted && (
            <TaskDialog
              editingTask={editingTask}
              newTaskTitle={newTaskTitle}
              newTaskDuration={newTaskDuration}
              onTitleChange={setNewTaskTitle}
              onDurationChange={setNewTaskDuration}
              onSubmit={editingTask ? handleUpdateTask : handleAddTask}
              isRoutineStarted={isRoutineStarted}
            />
          )}

          {completedTasks === tasks.length && tasks.length > 0 && (
            <div className="flex items-center justify-center space-x-4 p-6 bg-ninja-primary/10 rounded-xl animate-task-complete">
              <Trophy className="w-8 h-8 text-ninja-primary" />
              <p className="text-lg font-semibold text-ninja-primary">
                Amazing job! You've completed all tasks!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;