// Database types - matches Supabase schema exactly
export interface RoutineDB {
  id: string;
  title: string;
  start_time?: string | null;
  user_id?: string;
  created_at?: string;
}

// UI types - for component props
export interface Routine {
  id: string;
  title: string;
  start_time?: string | null;
}

export interface Task {
  id: string;
  title: string;
  duration: number;
  isActive: boolean;
  isCompleted: boolean;
  type?: 'regular' | 'focus';
}

export interface RoutineTask {
  id: string;
  routine_id: string;
  title: string;
  duration: number;
  position: number;
  type?: 'regular' | 'focus';
  created_at?: string;
}
