import { supabase } from '@/integrations/supabase/client';

// Client-side interface (camelCase)
export interface TrainingModule {
  id: string;
  moduleID: string;
  moduleTitle: string;
  description: string;
  facilitator?: string;
  participant?: string;
  category: string;
  tags: string[];
  duration: number;
  deliveryMethod: {
    format: string;
    breakout: string;
  };
  groupSize: {
    min: number;
    max: number;
    optimal: number;
    optimalBreakoutSize?: number;
  };
  mindsetTopics: string[];
  deliveryNotes: string;
  sampleMaterials: Array<{
    materialType: string;
    filename: string;
    fileFormat: string;
    fileUrl: string;
  }>;
  userID?: string;
  createdAt: string;
  updatedAt: string;
}

// Database interface (snake_case)
interface TrainingModuleDB {
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
}

// Client-side input interface (camelCase)
export interface TrainingModuleFormData {
  moduleTitle: string;
  description: string;
  facilitator?: string;
  participant?: string;
  category: string;
  tags: string[];
  duration: number;
  deliveryMethod: {
    format: string;
    breakout: 'yes' | 'no';
  };
  groupSize: {
    min: number;
    max: number;
    optimal: number;
    optimalBreakoutSize?: number;
  };
  mindsetTopics: string[];
  deliveryNotes?: string;
  sampleMaterials?: Array<{
    materialType: string;
    filename: string;
    fileFormat: string;
    fileUrl: string;
  }>;
}

// Database input interface (snake_case)
interface TrainingModuleFormDataDB {
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

// Mapping functions for modules
function mapModuleDBToClient(dbData: TrainingModuleDB): TrainingModule {
  return {
    id: dbData.id,
    moduleID: dbData.module_id,
    moduleTitle: dbData.module_title,
    description: dbData.description,
    facilitator: dbData.facilitator,
    participant: dbData.participant,
    category: dbData.category,
    tags: dbData.tags,
    duration: dbData.duration,
    deliveryMethod: dbData.delivery_method,
    groupSize: {
      min: dbData.group_size.min,
      max: dbData.group_size.max,
      optimal: dbData.group_size.optimal,
      optimalBreakoutSize: dbData.group_size['optimal breakout size'],
    },
    mindsetTopics: dbData.mindset_topics,
    deliveryNotes: dbData.delivery_notes,
    sampleMaterials: dbData.sample_materials,
    userID: dbData.user_id,
    createdAt: dbData.created_at,
    updatedAt: dbData.updated_at,
  };
}

function mapModuleClientToDB(clientData: TrainingModuleFormData): TrainingModuleFormDataDB {
  return {
    module_title: clientData.moduleTitle,
    description: clientData.description,
    facilitator: clientData.facilitator,
    participant: clientData.participant,
    category: clientData.category,
    tags: clientData.tags,
    duration: clientData.duration,
    delivery_method: clientData.deliveryMethod,
    group_size: {
      min: clientData.groupSize.min,
      max: clientData.groupSize.max,
      optimal: clientData.groupSize.optimal,
      'optimal breakout size': clientData.groupSize.optimalBreakoutSize,
    },
    mindset_topics: clientData.mindsetTopics,
    delivery_notes: clientData.deliveryNotes,
    sample_materials: clientData.sampleMaterials,
  };
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

    return (data || []).map(mapModuleDBToClient);
  }

  async addTrainingModule(moduleData: Omit<TrainingModuleFormData, 'id' | 'created_at' | 'updated_at'>): Promise<TrainingModule> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const dbData = {
      ...mapModuleClientToDB(moduleData as TrainingModuleFormData),
      module_id: `mod_${Date.now()}`,
      user_id: user?.id,
    };

    const { data, error } = await supabase
      .from('training_modules')
      .insert([dbData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add training module: ${error.message}`);
    }

    return mapModuleDBToClient(data);
  }

  async updateTrainingModule(id: string, moduleData: Partial<TrainingModuleFormData>): Promise<TrainingModule> {
    const dbData = moduleData.moduleTitle ? mapModuleClientToDB(moduleData as TrainingModuleFormData) : moduleData;
    
    const { data, error } = await supabase
      .from('training_modules')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update training module: ${error.message}`);
    }

    return mapModuleDBToClient(data);
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