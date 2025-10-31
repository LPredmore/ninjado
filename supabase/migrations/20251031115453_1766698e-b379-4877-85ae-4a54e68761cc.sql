-- Create routine_completions table for audit logging
CREATE TABLE public.routine_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  routine_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  routine_title TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  ip_address INET,
  user_agent TEXT,
  
  -- Foreign key to routines (ON DELETE SET NULL to preserve logs)
  CONSTRAINT routine_completions_routine_id_fkey 
    FOREIGN KEY (routine_id) 
    REFERENCES public.routines(id) 
    ON DELETE SET NULL
);

-- Create index for faster queries by user
CREATE INDEX idx_routine_completions_user_id 
  ON public.routine_completions(user_id);

-- Create index for time-based queries
CREATE INDEX idx_routine_completions_completed_at 
  ON public.routine_completions(completed_at DESC);

-- Create composite index for user + time queries
CREATE INDEX idx_routine_completions_user_time 
  ON public.routine_completions(user_id, completed_at DESC);

-- Enable Row Level Security
ALTER TABLE public.routine_completions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own completion logs
CREATE POLICY "Users can insert their own completion logs"
  ON public.routine_completions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own completion logs
CREATE POLICY "Users can view their own completion logs"
  ON public.routine_completions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Add helpful comment
COMMENT ON TABLE public.routine_completions IS 
  'Audit log for routine completions with user email, timestamp, and IP address';