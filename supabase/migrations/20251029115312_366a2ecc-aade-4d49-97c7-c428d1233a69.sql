-- Create function for batch position updates
CREATE OR REPLACE FUNCTION update_task_positions(
  task_updates jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  task_update jsonb;
BEGIN
  FOR task_update IN SELECT * FROM jsonb_array_elements(task_updates)
  LOOP
    UPDATE routine_tasks
    SET position = (task_update->>'position')::int
    WHERE id = (task_update->>'id')::uuid
    AND EXISTS (
      SELECT 1 FROM routines 
      WHERE routines.id = routine_tasks.routine_id 
      AND routines.user_id = auth.uid()
    );
  END LOOP;
END;
$$;