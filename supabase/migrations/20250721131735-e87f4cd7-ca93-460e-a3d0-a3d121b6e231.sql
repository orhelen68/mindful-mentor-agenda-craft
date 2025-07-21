-- Add facilitator and participant fields to training_modules table
ALTER TABLE public.training_modules 
ADD COLUMN facilitator TEXT,
ADD COLUMN participant TEXT;