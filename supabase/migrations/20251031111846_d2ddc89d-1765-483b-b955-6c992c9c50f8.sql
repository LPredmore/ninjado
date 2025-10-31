-- Fix bcrypt compatibility between bcryptjs ($2b$) and pgcrypto ($2a$)
-- Update verify_parental_pin function to normalize hash prefix

CREATE OR REPLACE FUNCTION public.verify_parental_pin(pin_input text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  stored_hash TEXT;
  normalized_hash TEXT;
BEGIN
  -- Get the hash for the current user
  SELECT pin_hash INTO stored_hash
  FROM parental_controls
  WHERE user_id = auth.uid() AND is_active = true;
  
  IF stored_hash IS NULL THEN
    RETURN false;
  END IF;
  
  -- Normalize $2b$ prefix to $2a$ for compatibility with pgcrypto's crypt()
  -- bcryptjs uses $2b$, pgcrypto supports $2a$
  normalized_hash := regexp_replace(stored_hash, '^\$2b', '$2a');
  
  -- Verify the PIN using crypt (bcrypt)
  RETURN crypt(pin_input, normalized_hash) = normalized_hash;
END;
$function$;