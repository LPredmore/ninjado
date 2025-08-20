-- Add start_time column to routines table
ALTER TABLE public.routines 
ADD COLUMN start_time time DEFAULT NULL;