import React, { useState, useEffect } from 'react';
import { Trophy, Plus } from 'lucide-react';
import { User, SupabaseClient } from '@supabase/supabase-js';
import TaskList from '@/components/TaskList';
import ProgressBar from '@/components/ProgressBar';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

  const handleTaskComplete = (taskId: string) => {
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
        <div className="flex justify-between items-center">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-ninja-text">Task Ninja</h1>
            <p className="text-gray-600">Complete your morning routine like a ninja!</p>
          </div>
          <Button onClick={handleSignOut} variant="outline">
            Sign Out
          </Button>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-ninja-text">
                Morning Routine Progress
              </h2>
              <p className="text-sm text-gray-500">
                {completedTasks} of {tasks.length} tasks completed
              </p>
            </div>
            {!isRoutineStarted && (
              <Button
                onClick={startRoutine}
                className="bg-ninja-primary text-white hover:bg-ninja-primary/90"
              >
                Start Routine
              </Button>
            )}
          </div>

          <ProgressBar current={completedTasks} total={tasks.length} />

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
            <div className="space-y-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full bg-ninja-accent text-white hover:bg-ninja-accent/90">
                    <Plus className="w-4 h-4 mr-2" /> Add New Task
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Task Name</label>
                      <Input
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Enter task name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Duration (minutes)</label>
                      <Input
                        type="number"
                        value={newTaskDuration}
                        onChange={(e) => setNewTaskDuration(e.target.value)}
                        placeholder="Enter duration in minutes"
                        min="1"
                      />
                    </div>
                    <Button
                      className="w-full bg-ninja-primary text-white hover:bg-ninja-primary/90"
                      onClick={editingTask ? handleUpdateTask : handleAddTask}
                    >
                      {editingTask ? 'Update Task' : 'Add Task'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
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
