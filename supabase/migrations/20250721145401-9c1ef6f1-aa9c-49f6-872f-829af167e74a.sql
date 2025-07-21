-- Create training_requirements table
CREATE TABLE public.training_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  training_id TEXT NOT NULL UNIQUE,
  training_title TEXT NOT NULL,
  description TEXT NOT NULL,
  target_audience JSONB NOT NULL,
  constraints JSONB NOT NULL,
  mindset_focus JSONB NOT NULL,
  delivery_preferences JSONB NOT NULL,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.training_requirements ENABLE ROW LEVEL SECURITY;

-- Create policies for training requirements
CREATE POLICY "Training requirements are viewable by everyone" 
ON public.training_requirements 
FOR SELECT 
USING (true);

CREATE POLICY "Training requirements can be created by everyone" 
ON public.training_requirements 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Training requirements can be updated by everyone" 
ON public.training_requirements 
FOR UPDATE 
USING (true);

CREATE POLICY "Training requirements can be deleted by everyone" 
ON public.training_requirements 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_training_requirements_updated_at
BEFORE UPDATE ON public.training_requirements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.training_requirements (
  training_id,
  training_title,
  description,
  target_audience,
  constraints,
  mindset_focus,
  delivery_preferences
) VALUES 
(
  'T001',
  'Leadership Mindset for New Managers',
  'Develop confident leadership mindset and essential management skills for newly promoted team leaders',
  '{"experienceLevel": "beginner", "industryContext": "Technology and startup companies"}',
  '{"duration": 960, "interactionLevel": "high"}',
  '{"learningObjectives": ["Develop confidence in leadership role", "Build effective communication skills", "Learn conflict resolution techniques", "Understand team motivation strategies"], "primaryTopics": ["leadership confidence", "communication", "team management"], "secondaryTopics": ["emotional intelligence", "decision making", "feedback delivery"]}',
  '{"format": "in-person", "groupSize": 12}'
),
(
  'T002',
  'Digital Transformation for Mid-Level Managers',
  'Navigate digital change and lead teams through technology adoption in modern workplaces',
  '{"experienceLevel": "intermediate", "industryContext": "Traditional industries transitioning to digital"}',
  '{"duration": 480, "interactionLevel": "medium"}',
  '{"learningObjectives": ["Understand digital transformation principles", "Develop change management skills", "Build digital literacy"], "primaryTopics": ["digital transformation", "change management", "technology adoption"], "secondaryTopics": ["innovation mindset", "data-driven decisions", "virtual team management"]}',
  '{"format": "hybrid", "groupSize": 15}'
),
(
  'T003',
  'Advanced Strategic Thinking Workshop',
  'Enhance strategic planning capabilities and long-term thinking for senior professionals',
  '{"experienceLevel": "advanced", "industryContext": "Consulting and professional services"}',
  '{"duration": 720, "interactionLevel": "high"}',
  '{"learningObjectives": ["Master strategic analysis frameworks", "Develop long-term vision", "Build scenario planning skills"], "primaryTopics": ["strategic thinking", "strategic planning", "vision development"], "secondaryTopics": ["market analysis", "competitive intelligence", "stakeholder management"]}',
  '{"format": "in-person", "groupSize": 10}'
);