import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RoutineSelectorProps {
  routines: Array<{ id: string; title: string }>;
  selectedRoutineId: string | null;
  onRoutineSelect: (id: string) => void;
}

const RoutineSelector = ({ routines, selectedRoutineId, onRoutineSelect }: RoutineSelectorProps) => {
  return (
    <Select
      value={selectedRoutineId || ''}
      onValueChange={onRoutineSelect}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select a routine" />
      </SelectTrigger>
      <SelectContent>
        {routines.map((routine) => (
          <SelectItem key={routine.id} value={routine.id}>
            {routine.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default RoutineSelector;