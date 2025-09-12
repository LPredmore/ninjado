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
    <div className="space-y-4">
      <Select
        value={selectedRoutineId || ''}
        onValueChange={onRoutineSelect}
      >
        <SelectTrigger className="clay-element h-14 text-lg font-medium clay-hover">
          <div className="flex items-center gap-3">
            <span className="clay-element w-8 h-8 gradient-clay-accent rounded-lg flex items-center justify-center text-sm">
              📜
            </span>
            <SelectValue placeholder="Choose your mission scroll..." />
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