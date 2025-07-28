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
  activityType: 'module' | 'formality' | 'speaker' | 'discussion' | 'break';
  activityDetails: any;
  notes?: string;
}

interface AgendaBuilderProps {
  requirement: TrainingRequirement;
  availableModules: TrainingModule[];
  matchedModules: TrainingModule[];
  onSave: (agenda: Omit<TrainingAgendaFormData, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialAgenda?: Omit<TrainingAgendaFormData, 'id' | 'createdAt' | 'updatedAt'>;
}

export function AgendaBuilder({ 
  requirement, 
  availableModules, 
  matchedModules, 
  onSave,
  initialAgenda
}: AgendaBuilderProps) {
  const [agendaTitle, setAgendaTitle] = useState(initialAgenda?.trainingTitle || requirement.trainingTitle);
  const [agendaDescription, setAgendaDescription] = useState(initialAgenda?.overview?.description || requirement.description);
  const [timeslots, setTimeslots] = useState<Timeslot[]>(initialAgenda?.timeslots || []);
  const [facilitatorNotes, setFacilitatorNotes] = useState(initialAgenda?.facilitatorNotes || '');
  const [materialsNeeded, setMaterialsNeeded] = useState<string[]>(initialAgenda?.materialsList || []);
  const [preReading, setPreReading] = useState<string[]>(initialAgenda?.preReading || []);
  const [postFollowUp, setPostFollowUp] = useState<string[]>(initialAgenda?.postWorkshopFollowUp || []);
  const [currentTab, setCurrentTab] = useState(initialAgenda ? 'preview' : 'builder');

  // Initialize with basic structure
  useEffect(() => {
    // Skip initialization if we already have initial agenda data
    if (initialAgenda) return;
    
    const targetDuration = requirement.constraints?.duration || 480; // 8 hours default
    const groupSize = requirement.deliveryPreferences?.groupSize || 12;
    
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
        const materials = module.sampleMaterials || [];
        return materials.map(material => 
          typeof material === 'string' ? material : material.filename || 'Material'
        );
      })
      .slice(0, 5);
    setMaterialsNeeded(initialMaterials);

  }, [requirement, matchedModules, initialAgenda]);

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
    const groupSize = requirement.deliveryPreferences?.groupSize || 12;

    const agendaData: Omit<TrainingAgendaFormData, 'id' | 'createdAt' | 'updatedAt'> = {
      trainingID: requirement.trainingID,
      trainingTitle: agendaTitle,
      overview: {
        description: agendaDescription,
        trainingObjectives: requirement.mindsetFocus?.learningObjectives || [],
        totalDuration,
        groupSize
      },
      timeslots,
      preReading: preReading,
      postWorkshopFollowUp: postFollowUp,
      facilitatorNotes,
      materialsList: materialsNeeded
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
      <Card className="shadow-xl bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 border-gray-200 dark:border-gray-700">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 rounded-full flex items-center justify-center border border-orange-100 dark:border-orange-800">
                <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="font-medium text-orange-700 dark:text-orange-300">
                  Total Duration: {totalDuration} minutes
                </p>
                <p className="text-sm text-muted-foreground">
                  Target: {targetDuration} minutes
                </p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${
              durationStatus === 'good' ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200' :
              durationStatus === 'short' ? 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border border-yellow-200' :
              'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200'
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
                    moduleID: module.moduleID,
                    moduleTitle: module.moduleTitle,
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