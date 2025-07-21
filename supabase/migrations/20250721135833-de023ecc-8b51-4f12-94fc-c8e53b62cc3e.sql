-- Update RLS policies to allow public access for INSERT and UPDATE operations
DROP POLICY IF EXISTS "Users can create training modules" ON public.training_modules;
DROP POLICY IF EXISTS "Users can update their own training modules" ON public.training_modules;
DROP POLICY IF EXISTS "Users can delete their own training modules" ON public.training_modules;

-- Allow everyone to create training modules
CREATE POLICY "Training modules can be created by everyone" 
ON public.training_modules 
FOR INSERT 
WITH CHECK (true);

-- Allow everyone to update training modules
CREATE POLICY "Training modules can be updated by everyone" 
ON public.training_modules 
FOR UPDATE 
USING (true);

-- Allow everyone to delete training modules
CREATE POLICY "Training modules can be deleted by everyone" 
ON public.training_modules 
FOR DELETE 
USING (true);