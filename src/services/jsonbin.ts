const JSONBIN_BASE_URL = 'https://api.jsonbin.io/v3';

// Helper functions to get credentials from localStorage
export const getRequirementsCredentials = () => {
  const stored = localStorage.getItem('jsonbin_requirements_credentials');
  return stored ? JSON.parse(stored) : null;
};

export const getModulesCredentials = () => {
  const stored = localStorage.getItem('jsonbin_modules_credentials');
  return stored ? JSON.parse(stored) : null;
};

export interface TrainingRequirement {
  id: string;
  trainingID: string;
  trainingTitle: string;
  description: string;
  targetAudience: {
    experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'mixed';
    industryContext: string;
  };
  constraints: {
    duration: number;
    interactionLevel: 'low' | 'medium' | 'high';
  };
  mindsetFocus: {
    learningObjectives: string[];
    primaryTopics: string[];
    secondaryTopics: string[];
  };
  deliveryPreferences: {
    format: 'in-person' | 'virtual' | 'hybrid';
    groupSize: number;
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
  private getHeaders(masterKey: string) {
    return {
      'Content-Type': 'application/json',
      'X-Master-Key': masterKey,
      'X-Bin-Meta': 'false',
    };
  }

  async getTrainingRequirements(): Promise<TrainingRequirement[]> {
    const credentials = getRequirementsCredentials();
    if (!credentials) {
      throw new Error('No credentials found for training requirements. Please configure JSONBin credentials.');
    }

    try {
      console.log('Fetching training requirements from:', `${JSONBIN_BASE_URL}/b/${credentials.binId}/latest`);
      
      const headers = this.getHeaders(credentials.masterKey);
      console.log('Headers:', headers);
      
      const response = await fetch(`${JSONBIN_BASE_URL}/b/${credentials.binId}/latest`, {
        method: 'GET',
        headers,
      });
      
      console.log('Response received:', response);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        console.error('Response not OK:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`Failed to fetch training requirements: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Fetched data structure:', data);
      console.log('Data.record:', data.record);
      
      return Array.isArray(data.record) ? data.record : (data.record ? [data.record] : []);
    } catch (error) {
      console.error('Detailed error fetching training requirements:', error);
      throw error;
    }
  }

  async updateTrainingRequirements(requirements: TrainingRequirement[]): Promise<void> {
    const credentials = getRequirementsCredentials();
    if (!credentials) {
      throw new Error('No credentials found for training requirements. Please configure JSONBin credentials.');
    }

    try {
      const response = await fetch(`${JSONBIN_BASE_URL}/b/${credentials.binId}`, {
        method: 'PUT',
        headers: this.getHeaders(credentials.masterKey),
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
    const credentials = getModulesCredentials();
    if (!credentials) {
      throw new Error('No credentials found for training modules. Please configure JSONBin credentials.');
    }

    try {
      console.log('Fetching training modules from:', `${JSONBIN_BASE_URL}/b/${credentials.binId}/latest`);
      
      const headers = this.getHeaders(credentials.masterKey);
      console.log('Headers:', headers);
      
      const response = await fetch(`${JSONBIN_BASE_URL}/b/${credentials.binId}/latest`, {
        method: 'GET',
        headers,
      });
      
      console.log('Response received:', response);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        console.error('Response not OK:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`Failed to fetch training modules: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Fetched modules data structure:', data);
      console.log('Modules data.record:', data.record);
      
      return Array.isArray(data.record) ? data.record : (data.record ? [data.record] : []);
    } catch (error) {
      console.error('Detailed error fetching training modules:', error);
      throw error;
    }
  }

  async updateTrainingModules(modules: TrainingModule[]): Promise<void> {
    const credentials = getModulesCredentials();
    if (!credentials) {
      throw new Error('No credentials found for training modules. Please configure JSONBin credentials.');
    }

    try {
      const response = await fetch(`${JSONBIN_BASE_URL}/b/${credentials.binId}`, {
        method: 'PUT',
        headers: this.getHeaders(credentials.masterKey),
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

  async createTrainingModule(moduleData: TrainingModule): Promise<TrainingModule> {
    const currentModules = await this.getTrainingModules();
    const updatedModules = [...currentModules, moduleData];
    
    await this.updateTrainingModules(updatedModules);
    return moduleData;
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