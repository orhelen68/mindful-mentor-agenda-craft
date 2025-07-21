const JSONBIN_BASE_URL = 'https://api.jsonbin.io/v3';
const MASTER_KEY = '$2a$10$APsAMK9yLPqFiHvrQNKQFOn0hk5QPCpPsZxGaU8us20ul28TMFMyO';

const TRAINING_REQUIREMENTS_BIN_ID = '687df942d1981e22d1898301';
const TRAINING_MODULES_BIN_ID = '687df9652d1dfe3c2c75a066';

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
  private headers = {
    'Content-Type': 'application/json',
    'X-Master-Key': MASTER_KEY,
    'X-Bin-Meta': 'false',
  };

  async getTrainingRequirements(): Promise<TrainingRequirement[]> {
    try {
      console.log('Fetching training requirements from:', `${JSONBIN_BASE_URL}/b/${TRAINING_REQUIREMENTS_BIN_ID}/latest`);
      console.log('Headers:', this.headers);
      
      // Try different fetch configurations
      const fetchOptions = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': MASTER_KEY,
          'X-Bin-Meta': 'false',
        },
      };
      
      console.log('Fetch options:', fetchOptions);
      
      const response = await fetch(`${JSONBIN_BASE_URL}/b/${TRAINING_REQUIREMENTS_BIN_ID}/latest`, fetchOptions);
      
      console.log('Response received:', response);
      console.log('Response status:', response.status);
      console.log('Response headers:', [...response.headers.entries()]);
      
      if (!response.ok) {
        console.error('Response not OK:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`Failed to fetch training requirements: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Fetched data structure:', data);
      console.log('Data.record:', data.record);
      console.log('Is data.record an array?', Array.isArray(data.record));
      
      return Array.isArray(data.record) ? data.record : (data.record ? [data.record] : []);
    } catch (error) {
      console.error('Detailed error fetching training requirements:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Return sample data for testing
      console.log('Returning sample data for testing purposes');
      return [
        {
          id: 'sample_1',
          trainingID: 'TRN001',
          trainingTitle: 'Sample Training - Connection Test',
          description: 'This is sample data while we debug the JSONbin connection',
          targetAudience: {
            experienceLevel: 'intermediate' as const,
            industryContext: 'Technology'
          },
          constraints: {
            duration: 120,
            interactionLevel: 'high' as const
          },
          mindsetFocus: {
            learningObjectives: ['Test objective 1', 'Test objective 2'],
            primaryTopics: ['Leadership', 'Communication'],
            secondaryTopics: ['Teamwork']
          },
          deliveryPreferences: {
            format: 'in-person' as const,
            groupSize: 20
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
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
      console.log('Fetching training modules from:', `${JSONBIN_BASE_URL}/b/${TRAINING_MODULES_BIN_ID}/latest`);
      console.log('Headers:', this.headers);
      
      const fetchOptions = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': MASTER_KEY,
          'X-Bin-Meta': 'false',
        },
      };
      
      console.log('Fetch options:', fetchOptions);
      
      const response = await fetch(`${JSONBIN_BASE_URL}/b/${TRAINING_MODULES_BIN_ID}/latest`, fetchOptions);
      
      console.log('Response received:', response);
      console.log('Response status:', response.status);
      console.log('Response headers:', [...response.headers.entries()]);
      
      if (!response.ok) {
        console.error('Response not OK:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`Failed to fetch training modules: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Fetched modules data structure:', data);
      console.log('Modules data.record:', data.record);
      console.log('Is modules data.record an array?', Array.isArray(data.record));
      
      return Array.isArray(data.record) ? data.record : (data.record ? [data.record] : []);
    } catch (error) {
      console.error('Detailed error fetching training modules:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Return sample data for testing
      console.log('Returning sample modules data for testing purposes');
      return [
        {
          id: 'sample_mod_1',
          title: 'Sample Module - Connection Test',
          description: 'This is sample module data while we debug the JSONbin connection',
          objectives: ['Test objective 1', 'Test objective 2'],
          duration: 60,
          materials: ['Sample material 1', 'Sample material 2'],
          activities: [
            {
              type: 'discussion' as const,
              description: 'Sample discussion activity',
              duration: 30
            }
          ],
          tags: ['sample', 'test'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
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