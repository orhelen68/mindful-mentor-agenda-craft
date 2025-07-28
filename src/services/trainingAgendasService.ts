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

// Client-side interface (camelCase)
export interface TrainingAgenda {
  id: string;
  trainingID: string;
  trainingTitle: string;
  overview: Overview;
  timeslots: Timeslot[];
  preReading?: string[];
  postWorkshopFollowUp?: string[];
  facilitatorNotes?: string;
  materialsList?: string[];
  userID?: string;
  createdAt: string;
  updatedAt: string;
}

// Database interface (snake_case)
interface TrainingAgendaDB {
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

// Client-side form interface (camelCase)
export interface TrainingAgendaFormData {
  id?: string;
  trainingID: string;
  trainingTitle: string;
  overview: Overview;
  timeslots: Timeslot[];
  preReading?: string[];
  postWorkshopFollowUp?: string[];
  facilitatorNotes?: string;
  materialsList?: string[];
  userID?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Database form interface (snake_case)
interface TrainingAgendaFormDataDB {
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

// Mapping functions for agendas
function mapAgendaDBToClient(dbData: TrainingAgendaDB): TrainingAgenda {
  return {
    id: dbData.id,
    trainingID: dbData.training_id,
    trainingTitle: dbData.training_title,
    overview: dbData.overview,
    timeslots: dbData.timeslots,
    preReading: dbData.pre_reading,
    postWorkshopFollowUp: dbData.post_workshop_follow_up,
    facilitatorNotes: dbData.facilitator_notes,
    materialsList: dbData.materials_list,
    userID: dbData.user_id,
    createdAt: dbData.created_at,
    updatedAt: dbData.updated_at,
  };
}

function mapAgendaClientToDB(clientData: TrainingAgendaFormData): TrainingAgendaFormDataDB {
  return {
    id: clientData.id,
    training_id: clientData.trainingID,
    training_title: clientData.trainingTitle,
    overview: clientData.overview,
    timeslots: clientData.timeslots,
    pre_reading: clientData.preReading,
    post_workshop_follow_up: clientData.postWorkshopFollowUp,
    facilitator_notes: clientData.facilitatorNotes,
    materials_list: clientData.materialsList,
    user_id: clientData.userID,
    created_at: clientData.createdAt,
    updated_at: clientData.updatedAt,
  };
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

    return (data || []).map(mapAgendaDBToClient);
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

    return data ? mapAgendaDBToClient(data) : null;
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

    return data ? mapAgendaDBToClient(data) : null;
  }

  async addTrainingAgenda(agendaData: Omit<TrainingAgendaFormData, 'id' | 'created_at' | 'updated_at'>): Promise<TrainingAgenda> {
    const { data: { user } } = await supabase.auth.getUser();
    const clientDataWithDefaults = {
      ...agendaData,
      id: undefined, // This will be excluded in the mapping
      createdAt: undefined,
      updatedAt: undefined,
      userID: user?.id,
    } as TrainingAgendaFormData;
    
    const dbData = mapAgendaClientToDB(clientDataWithDefaults);
    
    // Remove undefined fields to let database handle defaults
    const { id, created_at, updated_at, ...cleanDbData } = dbData;

    const { data, error } = await supabase
      .from('training_agendas')
      .insert([cleanDbData])
      .select()
      .single();

    if (error) {
      console.error('Error adding training agenda:', error);
      throw error;
    }

    return mapAgendaDBToClient(data);
  }

  async updateTrainingAgenda(id: string, agendaData: Partial<TrainingAgendaFormData>): Promise<TrainingAgenda> {
    const dbData = agendaData.trainingID ? mapAgendaClientToDB(agendaData as TrainingAgendaFormData) : agendaData;
    
    const { data, error } = await supabase
      .from('training_agendas')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating training agenda:', error);
      throw error;
    }

    return mapAgendaDBToClient(data);
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