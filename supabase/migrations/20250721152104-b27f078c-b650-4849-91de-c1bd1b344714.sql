-- Create training_agendas table
CREATE TABLE public.training_agendas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  training_id TEXT NOT NULL,
  training_title TEXT NOT NULL,
  overview JSONB NOT NULL,
  timeslots JSONB NOT NULL,
  pre_reading TEXT[],
  post_workshop_follow_up TEXT[],
  facilitator_notes TEXT,
  materials_list TEXT[],
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.training_agendas ENABLE ROW LEVEL SECURITY;

-- Create policies for training agendas
CREATE POLICY "Training agendas are viewable by everyone" 
ON public.training_agendas 
FOR SELECT 
USING (true);

CREATE POLICY "Training agendas can be created by everyone" 
ON public.training_agendas 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Training agendas can be updated by everyone" 
ON public.training_agendas 
FOR UPDATE 
USING (true);

CREATE POLICY "Training agendas can be deleted by everyone" 
ON public.training_agendas 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_training_agendas_updated_at
BEFORE UPDATE ON public.training_agendas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample training agenda data
INSERT INTO public.training_agendas (
  training_id,
  training_title,
  overview,
  timeslots,
  pre_reading,
  post_workshop_follow_up,
  facilitator_notes,
  materials_list
) VALUES (
  'T001',
  'Leadership Mindset for New Managers',
  '{
    "description": "Develop confident leadership mindset and essential management skills for newly promoted team leaders",
    "trainingObjectives": ["Develop confidence in leadership role", "Build effective communication skills", "Learn conflict resolution techniques"],
    "totalDuration": 480,
    "groupSize": 12
  }',
  '[
    {
      "sequenceNumber": 1,
      "startTime": "09:00",
      "duration": 15,
      "activityType": "break",
      "activityDetails": {
        "break": {
          "breakType": "tea",
          "duration": 15,
          "description": "Welcome coffee and networking",
          "location": "Main lobby"
        }
      },
      "notes": "Informal networking opportunity"
    },
    {
      "sequenceNumber": 2,
      "startTime": "09:15",
      "duration": 45,
      "activityType": "speaker",
      "activityDetails": {
        "speaker": {
          "speakerName": "Sarah Johnson",
          "speakerTitle": "Chief Leadership Officer",
          "topic": "The Leadership Mindset: From Individual Contributor to Leader",
          "description": "Opening keynote on leadership transformation",
          "duration": 45,
          "speakerBio": "Sarah has 15+ years of leadership experience in Fortune 500 companies"
        }
      },
      "notes": "Keynote to set the tone"
    },
    {
      "sequenceNumber": 3,
      "startTime": "10:00",
      "duration": 90,
      "activityType": "module",
      "activityDetails": {
        "module": {
          "moduleID": "MOD-001",
          "moduleTitle": "Building Leadership Confidence",
          "duration": 90,
          "facilitator": "John Smith",
          "notes": "Interactive module with role-playing exercises"
        }
      },
      "notes": "Core leadership development module"
    },
    {
      "sequenceNumber": 4,
      "startTime": "11:30",
      "duration": 30,
      "activityType": "discussion",
      "activityDetails": {
        "discussion": {
          "discussionTopic": "Leadership challenges in your context",
          "discussionType": "breakout",
          "duration": 30,
          "facilitator": "John Smith",
          "groupSize": 4,
          "objectives": ["Share real experiences", "Identify common challenges"]
        }
      },
      "notes": "Small group discussions"
    }
  ]',
  ARRAY['Leadership Fundamentals Handbook', 'Case Study: Transformational Leadership'],
  ARRAY['30-day leadership challenge', 'Peer mentoring setup', 'Follow-up coaching session'],
  'Ensure interactive elements and real-world application throughout the session',
  ARRAY['Flipchart paper', 'Markers', 'Name tags', 'Handouts']
),
(
  'T002',
  'Digital Transformation Workshop',
  '{
    "description": "Navigate digital change and lead teams through technology adoption",
    "trainingObjectives": ["Understand digital transformation principles", "Develop change management skills"],
    "totalDuration": 360,
    "groupSize": 15
  }',
  '[
    {
      "sequenceNumber": 1,
      "startTime": "09:00",
      "duration": 60,
      "activityType": "module",
      "activityDetails": {
        "module": {
          "moduleID": "MOD-002",
          "moduleTitle": "Digital Transformation Fundamentals",
          "duration": 60,
          "facilitator": "Tech Expert",
          "notes": "Foundation setting module"
        }
      },
      "notes": "Core concepts introduction"
    },
    {
      "sequenceNumber": 2,
      "startTime": "10:00",
      "duration": 15,
      "activityType": "break",
      "activityDetails": {
        "break": {
          "breakType": "stretch",
          "duration": 15,
          "description": "Quick energizer break"
        }
      },
      "notes": "Mid-morning break"
    }
  ]',
  ARRAY['Digital Transformation Guide', 'Industry Case Studies'],
  ARRAY['Digital action plan', 'Technology assessment tool'],
  'Focus on practical implementation strategies',
  ARRAY['Laptops', 'Digital tools access', 'Presentation slides']
);