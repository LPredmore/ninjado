-- Phase 1: Make pin_hash nullable so NULL = no PIN = no restrictions
ALTER TABLE parental_controls 
ALTER COLUMN pin_hash DROP NOT NULL;

-- Phase 3: Create secure function to check if PIN exists
CREATE OR REPLACE FUNCTION public.check_pin_exists()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM parental_controls 
    WHERE user_id = auth.uid() 
    AND pin_hash IS NOT NULL
  );
END;
$$;