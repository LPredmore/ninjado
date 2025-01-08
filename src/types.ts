export interface Task {
  id: string;
  title: string;
  duration: number;
  isActive: boolean;
  isCompleted: boolean;
  isSkipped?: boolean;
  position?: number;
}