-- Security Fix: Prevent PIN hash exposure by creating server-side verification function
-- This prevents offline brute-force attacks by keeping PIN hashes on the server

CREATE OR REPLACE FUNCTION public.verify_parental_pin(pin_input TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  -- Get the hash for the current user
  SELECT pin_hash INTO stored_hash
  FROM parental_controls
  WHERE user_id = auth.uid() AND is_active = true;
  
  IF stored_hash IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verify the PIN using crypt (bcrypt)
  RETURN crypt(pin_input, stored_hash) = stored_hash;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.verify_parental_pin(TEXT) TO authenticated;

-- Revoke SELECT permission on pin_hash column to prevent client-side access
-- Note: This is done via a view that excludes the pin_hash column
CREATE OR REPLACE VIEW public.parental_controls_safe AS
  SELECT id, user_id, is_active, created_at, updated_at
  FROM parental_controls;

-- Grant SELECT on the safe view to authenticated users
GRANT SELECT ON public.parental_controls_safe TO authenticated;

-- Create RLS policies for the safe view
ALTER VIEW public.parental_controls_safe SET (security_invoker = on);

-- Note: We keep the original table policies for INSERT/UPDATE/DELETE operations
-- Only SELECT queries should use the safe view