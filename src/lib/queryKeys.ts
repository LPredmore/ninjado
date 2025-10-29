export const queryKeys = {
  routines: (userId: string) => ["routines", userId] as const,
  tasks: (routineId: string | null) => ["tasks", routineId] as const,
  allRoutineTasks: (userId: string) => ["routines", "tasks", userId] as const,
};
