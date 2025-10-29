
import React from 'react';
import { Button } from "@/components/ui/button";
import { ShurikenButton } from '@/components/ninja/ShurikenButton';
import { Progress } from '@/components/ui/progress';
import { Play, Pause } from 'lucide-react';
import { useParentalControls } from '@/hooks/useParentalControls';
import PinPrompt from '@/components/PinPrompt';

interface RoutineProgressProps {
  routineTitle: string;
  completedTasks: number;
  totalTasks: number;
  isRoutineStarted: boolean;
  isPaused: boolean;
  onStartRoutine: () => void;
  onPauseRoutine: () => void;
  userId: string;
}

const RoutineProgress = ({
  routineTitle,
  completedTasks,
  totalTasks,
  isRoutineStarted,
  isPaused,
  onStartRoutine,
  onPauseRoutine,
  userId
}: RoutineProgressProps) => {
  const percentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const { isPinPromptOpen, requestAccess, handlePinSuccess, handlePinCancel } = useParentalControls(userId);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-2 flex-1">
          <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2 md:gap-3">
            <span className="clay-element-with-transition w-7 h-7 md:w-8 md:h-8 gradient-clay-accent rounded-xl flex items-center justify-center text-xs md:text-sm shrink-0">
              ⚔️
            </span>
            <span className="break-words">Training Progress</span>
          </h2>
          <p className="text-sm md:text-base text-muted-foreground font-medium">
            🎯 {completedTasks} of {totalTasks} missions completed
          </p>
        </div>
        
        {!isRoutineStarted ? (
          <ShurikenButton
            onClick={onStartRoutine}
            variant="jade"
            className="w-full md:w-auto text-base md:text-lg px-6 md:px-8 py-3 md:py-4"
          >
            ⚡ Begin Training
          </ShurikenButton>
        ) : (
          <Button
            onClick={() => requestAccess(onPauseRoutine)}
            variant="ninja-scroll"
            size="lg"
            className="w-full md:w-auto flex items-center justify-center gap-2"
          >
            {isPaused ? (
              <>
                <Play className="h-4 w-4 md:h-5 md:w-5" />
                <span className="text-sm md:text-base">Resume Mission</span>
              </>
            ) : (
              <>
                <Pause className="h-4 w-4 md:h-5 md:w-5" />
                <span className="text-sm md:text-base">Pause Training</span>
              </>
            )}
          </Button>
        )}
      </div>
      
      {/* Katana Progress Bar */}
      <div className="clay-element-with-transition p-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-sm font-bold text-foreground">Katana Power:</span>
          <span className="text-sm text-muted-foreground">{Math.round(percentage)}% charged</span>
        </div>
        <Progress value={percentage} className="h-6 clay-element-with-transition" />
      </div>
      
      <PinPrompt
        isOpen={isPinPromptOpen}
        onClose={handlePinCancel}
        onSuccess={handlePinSuccess}
        title="Training Control Security"
        description="Pause/Resume controls require parental authorization."
        userId={userId}
      />
    </div>
  );
};

export default RoutineProgress;
