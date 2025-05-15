
export interface Task {
  id: string;
  title: string;
  duration: number;
  isActive: boolean;
  isCompleted: boolean;
  type?: 'regular' | 'focus';
}

export interface Routine {
  id: string;
  title: string;
  start_time?: string | null; // Match the database column name
  startTime?: string; // Optional start time in HH:MM format
  endTime?: string;   // Optional end time (calculated)
}
