
import React from 'react';
import { Button } from "@/components/ui/button";
import { ShurikenButton } from '@/components/ninja/ShurikenButton';
import { Progress } from '@/components/ui/progress';
import { Play, Pause } from 'lucide-react';

interface RoutineProgressProps {
  routineTitle: string;
  completedTasks: number;
  totalTasks: number;
  isRoutineStarted: boolean;
  isPaused: boolean;
  onStartRoutine: () => void;
  onPauseRoutine: () => void;
}

const RoutineProgress = ({
  routineTitle,
  completedTasks,
  totalTasks,
  isRoutineStarted,
  isPaused,
  onStartRoutine,
  onPauseRoutine
}: RoutineProgressProps) => {
  const percentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <span className="clay-element w-8 h-8 gradient-clay-accent rounded-xl flex items-center justify-center text-sm">
              ⚔️
            </span>
            Training Progress
          </h2>
          <p className="text-muted-foreground font-medium">
            🎯 {completedTasks} of {totalTasks} missions completed
          </p>
        </div>
        
        {!isRoutineStarted ? (
          <ShurikenButton
            onClick={onStartRoutine}
            variant="jade"
            className="text-lg px-8 py-4"
          >
            ⚡ Begin Training
          </ShurikenButton>
        ) : (
          <Button
            onClick={onPauseRoutine}
            variant="ninja-scroll"
            size="lg"
            className="flex items-center gap-2"
          >
            {isPaused ? (
              <>
                <Play className="h-5 w-5" />
                Resume Mission
              </>
            ) : (
              <>
                <Pause className="h-5 w-5" />
                Pause Training
              </>
            )}
          </Button>
        )}
      </div>
      
      {/* Katana Progress Bar */}
      <div className="clay-element p-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-sm font-bold text-foreground">Katana Power:</span>
          <span className="text-sm text-muted-foreground">{Math.round(percentage)}% charged</span>
        </div>
        <Progress value={percentage} className="h-6 clay-element" />
      </div>
    </div>
  );
};

export default RoutineProgress;
