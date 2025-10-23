-- Fix 1: Restrict profiles table to only allow users to view their own profile
-- This prevents user enumeration and privacy violations
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Fix 2: Restrict subscribers table INSERT to only authenticated users creating their own records
-- This prevents anyone from creating fake subscriptions or bypassing payment
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;

CREATE POLICY "Users can create their own subscription" 
ON public.subscribers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);