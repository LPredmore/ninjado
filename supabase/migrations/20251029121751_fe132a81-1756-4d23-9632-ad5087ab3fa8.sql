-- Optimize update_task_positions function to use a single UPDATE with CTE
-- This replaces the looping approach with a more efficient bulk update

DROP FUNCTION IF EXISTS public.update_task_positions(jsonb);

CREATE OR REPLACE FUNCTION public.update_task_positions(task_updates jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Use a CTE to perform a single bulk UPDATE instead of looping
  -- This is much more efficient for PostgreSQL
  WITH updates AS (
    SELECT 
      (elem->>'id')::uuid AS task_id,
      (elem->>'position')::int AS new_position
    FROM jsonb_array_elements(task_updates) AS elem
  )
  UPDATE routine_tasks
  SET position = updates.new_position
  FROM updates
  WHERE routine_tasks.id = updates.task_id
  AND EXISTS (
    SELECT 1 FROM routines 
    WHERE routines.id = routine_tasks.routine_id 
    AND routines.user_id = auth.uid()
  );
END;
$function$;