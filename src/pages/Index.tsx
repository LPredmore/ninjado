import React, { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import TaskList from '@/components/TaskList';
import ProgressBar from '@/components/ProgressBar';
import { useToast } from '@/components/ui/use-toast';

const INITIAL_TASKS = [
  { id: '1', title: 'Get out of bed', duration: 2, isActive: false, isCompleted: false },
  { id: '2', title: 'Brush teeth', duration: 3, isActive: false, isCompleted: false },
  { id: '3', title: 'Get dressed', duration: 5, isActive: false, isCompleted: false },
  { id: '4', title: 'Pack backpack', duration: 3, isActive: false, isCompleted: false },
];

const Index = () => {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [isRoutineStarted, setIsRoutineStarted] = useState(false);
  const [activeTaskIndex, setActiveTaskIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const { toast } = useToast();

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
    setTimeLeft(INITIAL_TASKS[0].duration * 60);
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

  const completedTasks = tasks.filter((task) => task.isCompleted).length;

  return (
    <div className="min-h-screen bg-ninja-background p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-ninja-text">Task Ninja</h1>
          <p className="text-gray-600">Complete your morning routine like a ninja!</p>
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
              <button
                onClick={startRoutine}
                className="px-6 py-3 bg-ninja-primary text-white rounded-full font-medium hover:bg-ninja-primary/90 transition-colors"
              >
                Start Routine
              </button>
            )}
          </div>

          <ProgressBar current={completedTasks} total={tasks.length} />

          <TaskList
            tasks={tasks}
            activeTaskIndex={activeTaskIndex}
            timeLeft={timeLeft}
            onTaskComplete={handleTaskComplete}
          />

          {completedTasks === tasks.length && (
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