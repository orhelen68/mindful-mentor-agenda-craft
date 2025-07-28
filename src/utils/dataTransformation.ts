// Utility functions for data transformation between database and client formats

// Training Requirements transformations
export function transformRequirementFromDB(dbData: any) {
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

export function transformRequirementToDB(clientData: any) {
  return {
    training_id: clientData.trainingID,
    training_title: clientData.trainingTitle,
    description: clientData.description,
    target_audience: clientData.targetAudience,
    constraints: clientData.constraints,
    mindset_focus: clientData.mindsetFocus,
    delivery_preferences: clientData.deliveryPreferences,
    user_id: clientData.userID,
  };
}

// Training Modules transformations
export function transformModuleFromDB(dbData: any) {
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
      min: dbData.group_size?.min,
      max: dbData.group_size?.max,
      optimal: dbData.group_size?.optimal,
      optimalBreakoutSize: dbData.group_size?.['optimal breakout size'],
    },
    mindsetTopics: dbData.mindset_topics,
    deliveryNotes: dbData.delivery_notes,
    sampleMaterials: dbData.sample_materials,
    userID: dbData.user_id,
    createdAt: dbData.created_at,
    updatedAt: dbData.updated_at,
  };
}

export function transformModuleToDB(clientData: any) {
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
      min: clientData.groupSize?.min,
      max: clientData.groupSize?.max,
      optimal: clientData.groupSize?.optimal,
      'optimal breakout size': clientData.groupSize?.optimalBreakoutSize,
    },
    mindset_topics: clientData.mindsetTopics,
    delivery_notes: clientData.deliveryNotes,
    sample_materials: clientData.sampleMaterials,
    user_id: clientData.userID,
  };
}

// Training Agendas transformations
export function transformAgendaFromDB(dbData: any) {
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

export function transformAgendaToDB(clientData: any) {
  return {
    training_id: clientData.trainingID,
    training_title: clientData.trainingTitle,
    overview: clientData.overview,
    timeslots: clientData.timeslots,
    pre_reading: clientData.preReading,
    post_workshop_follow_up: clientData.postWorkshopFollowUp,
    facilitator_notes: clientData.facilitatorNotes,
    materials_list: clientData.materialsList,
    user_id: clientData.userID,
  };
}