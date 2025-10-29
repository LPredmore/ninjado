-- Create task performance metrics table
CREATE TABLE IF NOT EXISTS task_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES routine_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  total_executions INTEGER NOT NULL DEFAULT 0,
  average_time_variance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(task_id, user_id)
);

-- Create indexes for faster lookups
CREATE INDEX idx_task_performance_user ON task_performance_metrics(user_id);
CREATE INDEX idx_task_performance_task ON task_performance_metrics(task_id);

-- Enable RLS
ALTER TABLE task_performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own task metrics"
  ON task_performance_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own task metrics"
  ON task_performance_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own task metrics"
  ON task_performance_metrics FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own task metrics"
  ON task_performance_metrics FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_task_performance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_performance_updated_at
  BEFORE UPDATE ON task_performance_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_task_performance_updated_at();