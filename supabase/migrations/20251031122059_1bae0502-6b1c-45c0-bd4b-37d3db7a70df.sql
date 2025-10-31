-- Add efficiency tracking columns to routine_completions
ALTER TABLE public.routine_completions 
ADD COLUMN total_time_saved INTEGER NOT NULL DEFAULT 0,
ADD COLUMN total_routine_duration INTEGER NOT NULL DEFAULT 0,
ADD COLUMN has_regular_tasks BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN efficiency_percentage DECIMAL(5,2);

-- Create filtered index for efficient efficiency queries
CREATE INDEX idx_routine_completions_efficiency 
  ON public.routine_completions(user_id, has_regular_tasks, completed_at DESC) 
  WHERE has_regular_tasks = true;

-- Add helpful comment
COMMENT ON COLUMN public.routine_completions.efficiency_percentage IS 
  'Efficiency score: (total_time_saved / total_routine_duration) * 100. Higher is better. Can be negative if over time.';