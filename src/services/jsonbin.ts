const JSONBIN_BASE_URL = 'https://api.jsonbin.io/v3';
const MASTER_KEY = '$2a$10$APsAMK9yLPqFiHvrQNKQFOn0hk5QPCpPsZxGaU8us20ul28TMFMyO';

const TRAINING_REQUIREMENTS_BIN_ID = '687df942d1981e22d1898301';
const TRAINING_MODULES_BIN_ID = '687df9652d1dfe3c2c75a066';

export interface TrainingRequirement {
  id: string;
  objective: {
    mainGoal: string;
    specificOutcomes: string[];
    industryContext: string;
  };
  constraints: {
    duration: number;
    interactionLevel: 'low' | 'medium' | 'high';
  };
  mindsetFocus: {
    primaryMindset: string;
    secondaryMindsets: string[];
  };
  targetAudience: {
    roles: string[];
    experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'mixed';
    teamSize: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  objectives: string[];
  duration: number;
  materials: string[];
  activities: Array<{
    type: 'lecture' | 'discussion' | 'exercise' | 'case_study' | 'role_play';
    description: string;
    duration: number;
  }>;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

class JSONBinService {
  private headers = {
    'Content-Type': 'application/json',
    'X-Master-Key': MASTER_KEY,
  };

  async getTrainingRequirements(): Promise<TrainingRequirement[]> {
    try {
      const response = await fetch(`${JSONBIN_BASE_URL}/b/${TRAINING_REQUIREMENTS_BIN_ID}`, {
        headers: this.headers,
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch training requirements');
      }
      
      const data = await response.json();
      return Array.isArray(data.record) ? data.record : [data.record];
    } catch (error) {
      console.error('Error fetching training requirements:', error);
      return [];
    }
  }

  async updateTrainingRequirements(requirements: TrainingRequirement[]): Promise<void> {
    try {
      const response = await fetch(`${JSONBIN_BASE_URL}/b/${TRAINING_REQUIREMENTS_BIN_ID}`, {
        method: 'PUT',
        headers: this.headers,
        body: JSON.stringify(requirements),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update training requirements');
      }
    } catch (error) {
      console.error('Error updating training requirements:', error);
      throw error;
    }
  }

  async addTrainingRequirement(requirement: Omit<TrainingRequirement, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const requirements = await this.getTrainingRequirements();
    const newRequirement: TrainingRequirement = {
      ...requirement,
      id: `req_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    requirements.push(newRequirement);
    await this.updateTrainingRequirements(requirements);
  }

  async deleteTrainingRequirement(id: string): Promise<void> {
    const requirements = await this.getTrainingRequirements();
    const filteredRequirements = requirements.filter(req => req.id !== id);
    await this.updateTrainingRequirements(filteredRequirements);
  }

  async getTrainingModules(): Promise<TrainingModule[]> {
    try {
      const response = await fetch(`${JSONBIN_BASE_URL}/b/${TRAINING_MODULES_BIN_ID}`, {
        headers: this.headers,
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch training modules');
      }
      
      const data = await response.json();
      return Array.isArray(data.record) ? data.record : [data.record];
    } catch (error) {
      console.error('Error fetching training modules:', error);
      return [];
    }
  }

  async updateTrainingModules(modules: TrainingModule[]): Promise<void> {
    try {
      const response = await fetch(`${JSONBIN_BASE_URL}/b/${TRAINING_MODULES_BIN_ID}`, {
        method: 'PUT',
        headers: this.headers,
        body: JSON.stringify(modules),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update training modules');
      }
    } catch (error) {
      console.error('Error updating training modules:', error);
      throw error;
    }
  }

  async addTrainingModule(module: Omit<TrainingModule, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const modules = await this.getTrainingModules();
    const newModule: TrainingModule = {
      ...module,
      id: `mod_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    modules.push(newModule);
    await this.updateTrainingModules(modules);
  }

  async updateTrainingModule(id: string, updatedModule: Partial<TrainingModule>): Promise<void> {
    const modules = await this.getTrainingModules();
    const moduleIndex = modules.findIndex(mod => mod.id === id);
    
    if (moduleIndex === -1) {
      throw new Error('Training module not found');
    }
    
    modules[moduleIndex] = {
      ...modules[moduleIndex],
      ...updatedModule,
      updatedAt: new Date().toISOString(),
    };
    
    await this.updateTrainingModules(modules);
  }

  async deleteTrainingModule(id: string): Promise<void> {
    const modules = await this.getTrainingModules();
    const filteredModules = modules.filter(mod => mod.id !== id);
    await this.updateTrainingModules(filteredModules);
  }
}

export const jsonBinService = new JSONBinService();