import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TrainingRequirement } from '@/services/trainingRequirementsService';
import { TrainingModule } from '@/services/trainingModulesService';
import { TrainingAgendaFormData } from '@/services/trainingAgendasService';
import { TimeSlotManager } from '@/components/TimeSlotManager';
import { ModuleSelector } from '@/components/ModuleSelector';
import { AgendaPreview } from '@/components/AgendaPreview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Save, Eye } from 'lucide-react';

interface Timeslot {
  sequenceNumber: number;
  startTime: string;
  duration: number;
  activityType: 'module' | 'speaker' | 'discussion' | 'break';
  activityDetails: any;
  notes?: string;
}

interface AgendaBuilderProps {
  requirement: TrainingRequirement;
  availableModules: TrainingModule[];
  matchedModules: TrainingModule[];
  onSave: (agenda: Omit<TrainingAgendaFormData, 'id' | 'created_at' | 'updated_at'>) => void;
}

export function AgendaBuilder({ 
  requirement, 
  availableModules, 
  matchedModules, 
  onSave 
}: AgendaBuilderProps) {
  const [agendaTitle, setAgendaTitle] = useState(requirement.training_title);
  const [agendaDescription, setAgendaDescription] = useState(requirement.description);
  const [timeslots, setTimeslots] = useState<Timeslot[]>([]);
  const [facilitatorNotes, setFacilitatorNotes] = useState('');
  const [materialsNeeded, setMaterialsNeeded] = useState<string[]>([]);
  const [preReading, setPreReading] = useState<string[]>([]);
  const [postFollowUp, setPostFollowUp] = useState<string[]>([]);
  const [currentTab, setCurrentTab] = useState('builder');

  // Initialize with basic structure
  useEffect(() => {
    const targetDuration = requirement.constraints?.duration || 480; // 8 hours default
    const groupSize = requirement.delivery_preferences?.groupSize || 12;
    
    // Auto-generate opening timeslot
    const openingSlot: Timeslot = {
      sequenceNumber: 1,
      startTime: '09:00',
      duration: 15,
      activityType: 'break',
      activityDetails: {
        break: {
          breakType: 'tea',
          duration: 15,
          description: 'Welcome and networking',
          location: 'Main venue'
        }
      },
      notes: 'Arrival and informal networking'
    };

    setTimeslots([openingSlot]);
    
    // Set initial materials based on matched modules
    const initialMaterials = matchedModules
      .flatMap(module => {
        const materials = module.sample_materials || [];
        return materials.map(material => 
          typeof material === 'string' ? material : material.filename || 'Material'
        );
      })
      .slice(0, 5);
    setMaterialsNeeded(initialMaterials);

  }, [requirement, matchedModules]);

  const calculateTotalDuration = () => {
    return timeslots.reduce((total, slot) => total + slot.duration, 0);
  };

  const validateAgenda = () => {
    const totalDuration = calculateTotalDuration();
    const targetDuration = requirement.constraints?.duration || 480;
    const errors: string[] = [];

    if (totalDuration < targetDuration * 0.8) {
      errors.push(`Agenda is too short (${totalDuration} min vs target ${targetDuration} min)`);
    }
    if (totalDuration > targetDuration * 1.2) {
      errors.push(`Agenda is too long (${totalDuration} min vs target ${targetDuration} min)`);
    }
    if (timeslots.length === 0) {
      errors.push('No timeslots defined');
    }

    return errors;
  };

  const handleAddTimeslot = (newSlot: Timeslot) => {
    const maxSequence = Math.max(...timeslots.map(slot => slot.sequenceNumber), 0);
    const slotWithSequence = {
      ...newSlot,
      sequenceNumber: maxSequence + 1
    };
    setTimeslots([...timeslots, slotWithSequence]);
  };

  const handleUpdateTimeslot = (index: number, updatedSlot: Timeslot) => {
    const updated = [...timeslots];
    updated[index] = updatedSlot;
    setTimeslots(updated);
  };

  const handleDeleteTimeslot = (index: number) => {
    const updated = timeslots.filter((_, i) => i !== index);
    // Re-sequence
    const resequenced = updated.map((slot, i) => ({
      ...slot,
      sequenceNumber: i + 1
    }));
    setTimeslots(resequenced);
  };

  const handleReorderTimeslots = (newOrder: Timeslot[]) => {
    const resequenced = newOrder.map((slot, i) => ({
      ...slot,
      sequenceNumber: i + 1
    }));
    setTimeslots(resequenced);
  };

  const handleSave = () => {
    const errors = validateAgenda();
    if (errors.length > 0) {
      alert('Validation errors:\n' + errors.join('\n'));
      return;
    }

    const totalDuration = calculateTotalDuration();
    const groupSize = requirement.delivery_preferences?.groupSize || 12;

    const agendaData: Omit<TrainingAgendaFormData, 'id' | 'created_at' | 'updated_at'> = {
      training_id: requirement.training_id,
      training_title: agendaTitle,
      overview: {
        description: agendaDescription,
        trainingObjectives: requirement.mindset_focus?.learningObjectives || [],
        totalDuration,
        groupSize
      },
      timeslots,
      pre_reading: preReading,
      post_workshop_follow_up: postFollowUp,
      facilitator_notes: facilitatorNotes,
      materials_list: materialsNeeded
    };

    onSave(agendaData);
  };

  const totalDuration = calculateTotalDuration();
  const targetDuration = requirement.constraints?.duration || 480;
  const durationStatus = 
    totalDuration < targetDuration * 0.8 ? 'short' : 
    totalDuration > targetDuration * 1.2 ? 'long' : 'good';

  return (
    <div className="space-y-6">
      {/* Duration Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Clock className="h-5 w-5" />
              <div>
                <p className="font-medium">
                  Total Duration: {totalDuration} minutes
                </p>
                <p className="text-sm text-muted-foreground">
                  Target: {targetDuration} minutes
                </p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              durationStatus === 'good' ? 'bg-green-100 text-green-800' :
              durationStatus === 'short' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {durationStatus === 'good' ? 'On Track' :
               durationStatus === 'short' ? 'Too Short' : 'Too Long'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Builder Interface */}
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="builder" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Build Agenda
          </TabsTrigger>
          <TabsTrigger value="modules" className="flex items-center gap-2">
            Module Library
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-6">
          {/* Agenda Details */}
          <Card>
            <CardHeader>
              <CardTitle>Agenda Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Agenda Title</Label>
                <Input
                  id="title"
                  value={agendaTitle}
                  onChange={(e) => setAgendaTitle(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={agendaDescription}
                  onChange={(e) => setAgendaDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Time Slot Manager */}
          <TimeSlotManager
            timeslots={timeslots}
            availableModules={availableModules}
            onAddTimeslot={handleAddTimeslot}
            onUpdateTimeslot={handleUpdateTimeslot}
            onDeleteTimeslot={handleDeleteTimeslot}
            onReorderTimeslots={handleReorderTimeslots}
          />

          {/* Additional Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="facilitator-notes">Facilitator Notes</Label>
                <Textarea
                  id="facilitator-notes"
                  value={facilitatorNotes}
                  onChange={(e) => setFacilitatorNotes(e.target.value)}
                  placeholder="Special instructions, considerations, or notes for facilitators..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} size="lg" className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Training Agenda
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="modules">
          <ModuleSelector
            availableModules={availableModules}
            matchedModules={matchedModules}
            onSelectModule={(module) => {
              const newSlot: Timeslot = {
                sequenceNumber: 0, // Will be set in handleAddTimeslot
                startTime: '10:00',
                duration: module.duration || 60,
                activityType: 'module',
                activityDetails: {
                  module: {
                    moduleID: module.module_id,
                    moduleTitle: module.module_title,
                    duration: module.duration || 60,
                    facilitator: module.facilitator,
                    notes: ''
                  }
                },
                notes: ''
              };
              handleAddTimeslot(newSlot);
            }}
          />
        </TabsContent>

        <TabsContent value="preview">
          <AgendaPreview
            title={agendaTitle}
            description={agendaDescription}
            timeslots={timeslots}
            facilitatorNotes={facilitatorNotes}
            materialsNeeded={materialsNeeded}
            preReading={preReading}
            postFollowUp={postFollowUp}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}