import { supabase } from '@/integrations/supabase/client';

export interface TrainingModule {
  id: string;
  module_id: string;
  module_title: string;
  description: string;
  facilitator?: string;
  participant?: string;
  category: string;
  tags: string[];
  duration: number;
  delivery_method: {
    format: string;
    breakout: string;
  };
  group_size: {
    min: number;
    max: number;
    optimal: number;
    'optimal breakout size'?: number;
  };
  mindset_topics: string[];
  delivery_notes: string;
  sample_materials: Array<{
    materialType: string;
    filename: string;
    fileFormat: string;
    fileUrl: string;
  }>;
  user_id?: string;
  created_at: string;
  updated_at: string;
  
  // Legacy fields for compatibility with existing form
  title?: string;
  objectives?: string[];
  materials?: string[];
  activities?: Array<{
    type: 'lecture' | 'discussion' | 'exercise' | 'case_study' | 'role_play';
    description: string;
    duration: number;
  }>;
}

export interface TrainingModuleFormData {
  module_title: string;
  description: string;
  facilitator?: string;
  participant?: string;
  category: string;
  tags: string[];
  duration: number;
  delivery_method: {
    format: string;
    breakout: 'yes' | 'no';
  };
  group_size: {
    min: number;
    max: number;
    optimal: number;
    'optimal breakout size'?: number;
  };
  mindset_topics: string[];
  delivery_notes?: string;
  sample_materials?: Array<{
    materialType: string;
    filename: string;
    fileFormat: string;
    fileUrl: string;
  }>;
}

export class TrainingModulesService {
  async getTrainingModules(): Promise<TrainingModule[]> {
    const { data, error } = await supabase
      .from('training_modules')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch training modules: ${error.message}`);
    }

    return data || [];
  }

  async addTrainingModule(moduleData: Omit<TrainingModuleFormData, 'id' | 'created_at' | 'updated_at'>): Promise<TrainingModule> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const newModule = {
      ...moduleData,
      module_id: `mod_${Date.now()}`, // Generate a unique module_id
      user_id: user?.id,
    };

    const { data, error } = await supabase
      .from('training_modules')
      .insert([newModule])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add training module: ${error.message}`);
    }

    return data;
  }

  async updateTrainingModule(id: string, moduleData: Partial<TrainingModuleFormData>): Promise<TrainingModule> {
    const { data, error } = await supabase
      .from('training_modules')
      .update(moduleData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update training module: ${error.message}`);
    }

    return data;
  }

  async deleteTrainingModule(id: string): Promise<void> {
    const { error } = await supabase
      .from('training_modules')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete training module: ${error.message}`);
    }
  }
}

export const trainingModulesService = new TrainingModulesService();