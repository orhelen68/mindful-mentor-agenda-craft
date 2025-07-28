-- Add is_ai_generated column to training_agendas table
ALTER TABLE public.training_agendas 
ADD COLUMN is_ai_generated boolean NOT NULL DEFAULT false;