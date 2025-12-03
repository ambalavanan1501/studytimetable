-- Add subscription column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription jsonb;
