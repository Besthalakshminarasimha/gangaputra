-- Add latitude and longitude columns to existing hatcheries table
ALTER TABLE public.hatcheries ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.hatcheries ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;