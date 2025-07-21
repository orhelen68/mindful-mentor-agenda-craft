import { supabase } from '@/integrations/supabase/client';

export interface TrainingRequirement {
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

export interface CreateTrainingRequirementData {
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

    return data || [];
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

    return data;
  }

  async addTrainingRequirement(requirementData: CreateTrainingRequirementData): Promise<TrainingRequirement> {
    const { data, error } = await supabase
      .from('training_requirements')
      .insert([requirementData])
      .select()
      .single();

    if (error) {
      console.error('Error adding training requirement:', error);
      throw error;
    }

    return data;
  }

  async updateTrainingRequirement(id: string, requirementData: Partial<CreateTrainingRequirementData>): Promise<TrainingRequirement> {
    const { data, error } = await supabase
      .from('training_requirements')
      .update(requirementData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating training requirement:', error);
      throw error;
    }

    return data;
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