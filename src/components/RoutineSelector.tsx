import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NinjaScrollCard } from '@/components/ninja/NinjaScrollCard';
import { cn } from '@/lib/utils';

interface RoutineSelectorProps {
  routines: Array<{ id: string; title: string }>;
  selectedRoutineId: string | null;
  onRoutineSelect: (id: string) => void;
}

const RoutineSelector = ({ routines, selectedRoutineId, onRoutineSelect }: RoutineSelectorProps) => {
  if (routines.length === 0) {
    return (
      <div className="clay-element p-8 text-center">
        <div className="clay-element w-16 h-16 gradient-clay-accent rounded-full mx-auto mb-4 flex items-center justify-center glow-jade">
          <span className="text-2xl">📜</span>
        </div>
        <p className="text-muted-foreground">No mission scrolls available. Create your first routine to begin training!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-full">
      <Select
        value={selectedRoutineId || ''}
        onValueChange={onRoutineSelect}
      >
        <SelectTrigger className="clay-element h-12 md:h-14 text-base md:text-lg font-medium clay-hover max-w-full">
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            <span className="clay-element w-7 h-7 md:w-8 md:h-8 gradient-clay-accent rounded-lg flex items-center justify-center text-xs md:text-sm shrink-0">
              📜
            </span>
            <SelectValue placeholder="Choose your mission scroll..." className="truncate" />
          </div>
        </SelectTrigger>
        <SelectContent className="clay-element border-border/50 backdrop-blur-md">
          {routines.map((routine) => (
            <SelectItem 
              key={routine.id} 
              value={routine.id}
              className="clay-hover rounded-lg my-1 p-3 text-base font-medium"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">🥷</span>
                {routine.title}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {selectedRoutineId && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            🎯 Mission scroll selected! Ready to begin training.
          </p>
        </div>
      )}
    </div>
  );
};

export default RoutineSelector;