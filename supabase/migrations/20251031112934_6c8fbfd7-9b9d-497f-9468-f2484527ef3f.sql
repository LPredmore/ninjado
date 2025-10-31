-- Fix verify_parental_pin to access pgcrypto functions and use correct PIN check
CREATE OR REPLACE FUNCTION public.verify_parental_pin(pin_input text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  stored_hash TEXT;
  normalized_hash TEXT;
BEGIN
  -- Get the hash for the current user (check pin_hash exists, not is_active)
  SELECT pin_hash INTO stored_hash
  FROM parental_controls
  WHERE user_id = auth.uid() AND pin_hash IS NOT NULL;
  
  IF stored_hash IS NULL THEN
    RETURN false;
  END IF;
  
  -- Normalize $2b$ prefix to $2a$ for pgcrypto compatibility
  normalized_hash := regexp_replace(stored_hash, '^\$2b', '$2a');
  
  -- Verify using crypt (now accessible via extensions schema)
  RETURN crypt(pin_input, normalized_hash) = normalized_hash;
END;
$function$;