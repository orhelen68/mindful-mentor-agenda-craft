import { supabase } from "@/integrations/supabase/client";

// Activity detail interfaces
interface ModuleActivity {
  moduleID: string;
  moduleTitle: string;
  duration: number;
  facilitator?: string;
  notes?: string;
}

interface SpeakerActivity {
  speakerName: string;
  speakerTitle?: string;
  topic: string;
  description?: string;
  duration: number;
  speakerBio?: string;
  notes?: string;
}

interface DiscussionActivity {
  discussionTopic: string;
  discussionType: "plenary" | "breakout" | "group";
  duration: number;
  facilitator?: string;
  groupSize?: number;
  objectives?: string[];
  notes?: string;
}

interface BreakActivity {
  breakType: "tea" | "lunch" | "stretch" | "long";
  duration: number;
  description?: string;
  location?: string;
  notes?: string;
}

// Activity details union type
interface ActivityDetails {
  module?: ModuleActivity;
  speaker?: SpeakerActivity;
  discussion?: DiscussionActivity;
  break?: BreakActivity;
}

// Timeslot interface
interface Timeslot {
  sequenceNumber: number;
  startTime: string;
  duration: number;
  activityType: "module" | "formality" | "speaker" | "discussion" | "break";
  activityDetails: ActivityDetails;
  notes?: string;
}

// Overview interface
interface Overview {
  description: string;
  trainingObjectives: string[];
  totalDuration: number;
  groupSize: number;
}

// Main training agenda interface
export interface TrainingAgenda {
  id: string;
  training_id: string;
  training_title: string;
  overview: Overview;
  timeslots: Timeslot[];
  pre_reading?: string[];
  post_workshop_follow_up?: string[];
  facilitator_notes?: string;
  materials_list?: string[];
  user_id?: string;
  created_at: string;
  updated_at: string;
}

// Form data interface for creating/updating agendas
export interface TrainingAgendaFormData {
  id?: string;
  training_id: string;
  training_title: string;
  overview: Overview;
  timeslots: Timeslot[];
  pre_reading?: string[];
  post_workshop_follow_up?: string[];
  facilitator_notes?: string;
  materials_list?: string[];
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

class TrainingAgendasService {
  async getTrainingAgendas(): Promise<TrainingAgenda[]> {
    const { data, error } = await supabase
      .from('training_agendas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching training agendas:', error);
      throw error;
    }

    return data || [];
  }

  async getTrainingAgendaById(id: string): Promise<TrainingAgenda | null> {
    const { data, error } = await supabase
      .from('training_agendas')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching training agenda:', error);
      throw error;
    }

    return data;
  }

  async getTrainingAgendaByTrainingId(trainingId: string): Promise<TrainingAgenda | null> {
    const { data, error } = await supabase
      .from('training_agendas')
      .select('*')
      .eq('training_id', trainingId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching training agenda by training ID:', error);
      throw error;
    }

    return data;
  }

  async addTrainingAgenda(agendaData: Omit<TrainingAgendaFormData, 'id' | 'created_at' | 'updated_at'>): Promise<TrainingAgenda> {
    const { data, error } = await supabase
      .from('training_agendas')
      .insert([agendaData])
      .select()
      .single();

    if (error) {
      console.error('Error adding training agenda:', error);
      throw error;
    }

    return data;
  }

  async updateTrainingAgenda(id: string, agendaData: Partial<TrainingAgendaFormData>): Promise<TrainingAgenda> {
    const { data, error } = await supabase
      .from('training_agendas')
      .update(agendaData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating training agenda:', error);
      throw error;
    }

    return data;
  }

  async deleteTrainingAgenda(id: string): Promise<void> {
    const { error } = await supabase
      .from('training_agendas')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting training agenda:', error);
      throw error;
    }
  }
}

export const trainingAgendasService = new TrainingAgendasService();