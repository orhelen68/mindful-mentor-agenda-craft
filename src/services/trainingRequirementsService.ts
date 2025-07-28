import { supabase } from '@/integrations/supabase/client';

// Client-side interface (camelCase)
export interface TrainingRequirement {
  id: string;
  trainingID: string;
  trainingTitle: string;
  description: string;
  targetAudience: {
    experienceLevel: string;
    industryContext: string;
  };
  constraints: {
    duration: number;
    interactionLevel: string;
  };
  mindsetFocus: {
    learningObjectives: string[];
    primaryTopics: string[];
    secondaryTopics: string[];
  };
  deliveryPreferences: {
    format: string;
    groupSize: number;
  };
  userID?: string;
  createdAt: string;
  updatedAt: string;
}

// Database interface (snake_case)
interface TrainingRequirementDB {
  id: string;
  training_id: string;
  training_title: string;
  description: string;
  target_audience: {
    experienceLevel: string;
    industryContext: string;
  };
  constraints: {
    duration: number;
    interactionLevel: string;
  };
  mindset_focus: {
    learningObjectives: string[];
    primaryTopics: string[];
    secondaryTopics: string[];
  };
  delivery_preferences: {
    format: string;
    groupSize: number;
  };
  user_id?: string;
  created_at: string;
  updated_at: string;
}

// Client-side input interface (camelCase)
export interface CreateTrainingRequirementData {
  trainingID: string;
  trainingTitle: string;
  description: string;
  targetAudience: {
    experienceLevel: string;
    industryContext: string;
  };
  constraints: {
    duration: number;
    interactionLevel: string;
  };
  mindsetFocus: {
    learningObjectives: string[];
    primaryTopics: string[];
    secondaryTopics: string[];
  };
  deliveryPreferences: {
    format: string;
    groupSize: number;
  };
}

// Database input interface (snake_case)
interface CreateTrainingRequirementDataDB {
  training_id: string;
  training_title: string;
  description: string;
  target_audience: {
    experienceLevel: string;
    industryContext: string;
  };
  constraints: {
    duration: number;
    interactionLevel: string;
  };
  mindset_focus: {
    learningObjectives: string[];
    primaryTopics: string[];
    secondaryTopics: string[];
  };
  delivery_preferences: {
    format: string;
    groupSize: number;
  };
}

// Mapping functions
function mapDBToClient(dbData: TrainingRequirementDB): TrainingRequirement {
  return {
    id: dbData.id,
    trainingID: dbData.training_id,
    trainingTitle: dbData.training_title,
    description: dbData.description,
    targetAudience: dbData.target_audience,
    constraints: dbData.constraints,
    mindsetFocus: dbData.mindset_focus,
    deliveryPreferences: dbData.delivery_preferences,
    userID: dbData.user_id,
    createdAt: dbData.created_at,
    updatedAt: dbData.updated_at,
  };
}

function mapClientToDB(clientData: CreateTrainingRequirementData): CreateTrainingRequirementDataDB {
  return {
    training_id: clientData.trainingID,
    training_title: clientData.trainingTitle,
    description: clientData.description,
    target_audience: clientData.targetAudience,
    constraints: clientData.constraints,
    mindset_focus: clientData.mindsetFocus,
    delivery_preferences: clientData.deliveryPreferences,
  };
}

class TrainingRequirementsService {
  async getTrainingRequirements(): Promise<TrainingRequirement[]> {
    const { data, error } = await supabase
      .from('training_requirements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching training requirements:', error);
      throw error;
    }

    return (data || []).map(mapDBToClient);
  }

  async getTrainingRequirement(id: string): Promise<TrainingRequirement | null> {
    const { data, error } = await supabase
      .from('training_requirements')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching training requirement:', error);
      throw error;
    }

    return data ? mapDBToClient(data) : null;
  }

  async addTrainingRequirement(requirementData: CreateTrainingRequirementData): Promise<TrainingRequirement> {
    const { data: { user } } = await supabase.auth.getUser();
    const dbData = {
      ...mapClientToDB(requirementData),
      user_id: user?.id,
    };

    const { data, error } = await supabase
      .from('training_requirements')
      .insert([dbData])
      .select()
      .single();

    if (error) {
      console.error('Error adding training requirement:', error);
      throw error;
    }

    return mapDBToClient(data);
  }

  async updateTrainingRequirement(id: string, requirementData: Partial<CreateTrainingRequirementData>): Promise<TrainingRequirement> {
    const dbData = requirementData.trainingID ? mapClientToDB(requirementData as CreateTrainingRequirementData) : requirementData;
    
    const { data, error } = await supabase
      .from('training_requirements')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating training requirement:', error);
      throw error;
    }

    return mapDBToClient(data);
  }

  async deleteTrainingRequirement(id: string): Promise<void> {
    const { error } = await supabase
      .from('training_requirements')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting training requirement:', error);
      throw error;
    }
  }
}

export const trainingRequirementsService = new TrainingRequirementsService();