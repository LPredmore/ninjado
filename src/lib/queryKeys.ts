export const queryKeys = {
  routines: (userId: string) => ["routines", userId] as const,
  tasks: (routineId: string | null) => ["tasks", routineId] as const,
  allRoutineTasks: (routineIds: string[]) => ["routines", "tasks", routineIds] as const,
};
