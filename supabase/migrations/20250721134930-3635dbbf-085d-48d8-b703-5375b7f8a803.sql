-- Update RLS policy to allow public access to training modules
DROP POLICY IF EXISTS "Training modules are viewable by all authenticated users" ON public.training_modules;

CREATE POLICY "Training modules are viewable by everyone" 
ON public.training_modules 
FOR SELECT 
USING (true);