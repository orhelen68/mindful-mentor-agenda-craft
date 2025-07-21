-- Create training_modules table
CREATE TABLE public.training_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id TEXT NOT NULL UNIQUE,
  module_title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  tags TEXT[],
  duration INTEGER, -- duration in minutes
  delivery_method JSONB, -- {format: string, breakout: string}
  group_size JSONB, -- {min: number, max: number, optimal: number, "optimal breakout size"?: number}
  mindset_topics TEXT[],
  delivery_notes TEXT,
  sample_materials JSONB, -- array of material objects
  user_id UUID, -- for user-specific modules if needed
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.training_modules ENABLE ROW LEVEL SECURITY;

-- Create policies for training modules
-- Allow users to view all training modules (if they should be shared)
CREATE POLICY "Training modules are viewable by all authenticated users" 
ON public.training_modules 
FOR SELECT 
TO authenticated
USING (true);

-- Allow users to create their own modules
CREATE POLICY "Users can create training modules" 
ON public.training_modules 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Allow users to update their own modules
CREATE POLICY "Users can update their own training modules" 
ON public.training_modules 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id OR user_id IS NULL);

-- Allow users to delete their own modules
CREATE POLICY "Users can delete their own training modules" 
ON public.training_modules 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id OR user_id IS NULL);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_training_modules_updated_at
  BEFORE UPDATE ON public.training_modules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.training_modules (
  module_id, module_title, description, category, tags, duration,
  delivery_method, group_size, mindset_topics, delivery_notes, sample_materials,
  created_at, updated_at
) VALUES 
(
  'mod_001',
  'Leadership Confidence Building',
  'Interactive exercises to build self-confidence and leadership presence',
  'Leadership Development',
  ARRAY['confidence', 'leadership', 'self-awareness', 'presence'],
  90,
  '{"format": "exercise", "breakout": "yes"}'::jsonb,
  '{"min": 8, "max": 16, "optimal": 12, "optimal breakout size": 4}'::jsonb,
  ARRAY['leadership confidence', 'self-awareness', 'personal presence'],
  'Start with individual reflection, move to pair sharing, then small group exercises. Use role-play scenarios relevant to participants'' work contexts.',
  '[
    {
      "materialType": "presentation",
      "filename": "leadership-confidence-slides.pptx",
      "fileFormat": "pptx",
      "fileUrl": "https://sample-url.com/slides1.pptx"
    },
    {
      "materialType": "facilitator_guide",
      "filename": "confidence-facilitator-guide.pdf",
      "fileFormat": "pdf",
      "fileUrl": "https://sample-url.com/guide1.pdf"
    },
    {
      "materialType": "worksheet",
      "filename": "confidence-self-assessment.pdf",
      "fileFormat": "pdf",
      "fileUrl": "https://sample-url.com/worksheet1.pdf"
    }
  ]'::jsonb,
  '2024-01-10T10:00:00Z'::timestamptz,
  '2024-01-10T10:00:00Z'::timestamptz
),
(
  'mod_002',
  'Effective Communication Styles',
  'Explore different communication styles and practice adaptive communication techniques',
  'Communication Skills',
  ARRAY['communication', 'styles', 'adaptation', 'listening'],
  75,
  '{"format": "game", "breakout": "no"}'::jsonb,
  '{"min": 6, "max": 20, "optimal": 12, "optimal breakout size": 3}'::jsonb,
  ARRAY['communication', 'empathy', 'active listening'],
  'Use communication style assessment followed by interactive games. Include practice scenarios with feedback rounds.',
  '[
    {
      "materialType": "presentation",
      "filename": "communication-styles-overview.pptx",
      "fileFormat": "pptx",
      "fileUrl": "https://sample-url.com/slides2.pptx"
    },
    {
      "materialType": "handout",
      "filename": "communication-styles-reference.pdf",
      "fileFormat": "pdf",
      "fileUrl": "https://sample-url.com/handout1.pdf"
    }
  ]'::jsonb,
  '2024-01-11T14:00:00Z'::timestamptz,
  '2024-01-11T14:00:00Z'::timestamptz
);