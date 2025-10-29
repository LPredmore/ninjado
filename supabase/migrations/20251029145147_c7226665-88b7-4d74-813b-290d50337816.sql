-- Fix: Set search_path for function security
DROP FUNCTION IF EXISTS update_task_performance_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION update_task_performance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public;

-- Recreate trigger
CREATE TRIGGER task_performance_updated_at
  BEFORE UPDATE ON task_performance_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_task_performance_updated_at();