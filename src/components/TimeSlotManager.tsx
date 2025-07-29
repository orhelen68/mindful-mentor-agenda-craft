import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { TrainingModule } from '@/services/trainingModulesService';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Plus, 
  GripVertical, 
  Trash2, 
  Clock,
  User,
  MessageSquare,
  Coffee,
  BookOpen
} from 'lucide-react';

interface Timeslot {
  sequenceNumber: number;
  startTime: string;
  duration: number;
  activityType: 'module' | 'formality' | 'speaker' | 'discussion' | 'break';
  activityDetails: any;
  notes?: string;
}

interface TimeSlotManagerProps {
  timeslots: Timeslot[];
  availableModules: TrainingModule[];
  onAddTimeslot: (timeslot: Timeslot) => void;
  onUpdateTimeslot: (index: number, timeslot: Timeslot) => void;
  onDeleteTimeslot: (index: number) => void;
  onReorderTimeslots: (newOrder: Timeslot[]) => void;
}

function SortableTimeslot({ 
  timeslot, 
  index, 
  availableModules,
  onUpdate, 
  onDelete 
}: {
  timeslot: Timeslot;
  index: number;
  availableModules: TrainingModule[];
  onUpdate: (timeslot: Timeslot) => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: timeslot.sequenceNumber });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getActivityIcon = () => {
    switch (timeslot.activityType) {
      case 'module': return <BookOpen className="h-4 w-4" />;
      case 'formality': return <Clock className="h-4 w-4" />;
      case 'speaker': return <User className="h-4 w-4" />;
      case 'discussion': return <MessageSquare className="h-4 w-4" />;
      case 'break': return <Coffee className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getActivityTitle = () => {
    const details = timeslot.activityDetails;
    switch (timeslot.activityType) {
      case 'module':
        return timeslot.activityDetails.module?.moduleTitle || 'Module Activity';
      case 'formality':
        return details.formality?.formalityType || 'Formality';
      case 'speaker':
        return `${details.speaker?.speakerName}: ${details.speaker?.topic}` || 'Speaker Session';
      case 'discussion':
        return details.discussion?.discussionTopic || 'Discussion';
      case 'break':
        return `${details.break?.breakType} break` || 'Break';
      default:
        return 'Activity';
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab hover:cursor-grabbing p-1 hover:bg-muted rounded"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
              {getActivityIcon()}
              <div>
                <CardTitle className="text-lg">{getActivityTitle()}</CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{timeslot.startTime}</span>
                  <span>{timeslot.duration} minutes</span>
                  <Badge variant="outline" className="capitalize">
                    {timeslot.activityType}
                  </Badge>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="bg-white border-gray-200 hover:bg-gray-50"
            >
              <Trash2 className="h-4 w-4 text-green-600" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <TimeslotEditor
            timeslot={timeslot}
            availableModules={availableModules}
            onChange={onUpdate}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function TimeslotEditor({
  timeslot,
  availableModules,
  onChange
}: {
  timeslot: Timeslot;
  availableModules: TrainingModule[];
  onChange: (timeslot: Timeslot) => void;
}) {
  const handleFieldChange = (field: string, value: any) => {
    onChange({
      ...timeslot,
      [field]: value
    });
  };

  const handleActivityDetailsChange = (activityType: string, details: any) => {
    onChange({
      ...timeslot,
      activityType: activityType as any,
      activityDetails: { [activityType]: details }
    });
  };

  const renderActivityDetails = () => {
    const activityType = timeslot.activityType;
    const details = timeslot.activityDetails[activityType] || {};

    switch (activityType) {
      case 'formality':
        return (
          <div className="space-y-3">
            <div>
              <Label>Formality Type</Label>
              <Select
                value={details.formalityType || ''}
                onValueChange={(value) => handleActivityDetailsChange('formality', {
                  ...details,
                  formalityType: value
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select formality type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="opening">Opening</SelectItem>
                  <SelectItem value="intro">Intro</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="qa">Q&A</SelectItem>
                  <SelectItem value="nextsteps">Next Steps</SelectItem>
                  <SelectItem value="closing">Closing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={details.description || ''}
                onChange={(e) => handleActivityDetailsChange('formality', {
                  ...details,
                  description: e.target.value
                })}
                placeholder="Brief description of this formality"
                rows={2}
              />
            </div>
          </div>
        );

      case 'module':
        return (
          <div className="space-y-3">
            <div>
              <Label>Select Module</Label>
              <Select
                value={details.moduleID || ''}
                onValueChange={(value) => {
                  const selectedModule = availableModules.find(m => m.moduleID === value);
                  console.log('Selected module:', selectedModule);
                  if (selectedModule) {
                    const newDetails = {
                      moduleID: selectedModule.moduleID,
                      moduleTitle: selectedModule.moduleTitle,
                      duration: selectedModule.duration,
                      facilitator: details.facilitator || '',
                      notes: details.notes || ''
                    };
                    console.log('Setting module details:', newDetails);
                    handleActivityDetailsChange('module', newDetails);
                    handleFieldChange('duration', selectedModule.duration || 60);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a training module" />
                </SelectTrigger>
                <SelectContent>
                  {availableModules.map((module) => (
                    <SelectItem key={module.moduleID} value={module.moduleID}>
                      {module.moduleTitle} ({module.duration} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {details.moduleTitle && (
              <div className="text-sm text-foreground mt-2 bg-yellow-100 p-2 rounded">
                Selected: {details.moduleTitle} (Debug: moduleID={details.moduleID})
              </div>
            )}
            {!details.moduleTitle && details.moduleID && (
              <div className="text-sm text-red-500 mt-2">
                Warning: moduleID exists ({details.moduleID}) but no moduleTitle
              </div>
            )}
            {details.facilitator && (
              <div>
                <Label>Facilitator</Label>
                <Input
                  value={details.facilitator || ''}
                  onChange={(e) => handleActivityDetailsChange('module', {
                    moduleID: details.moduleID,
                    moduleTitle: details.moduleTitle,
                    duration: details.duration,
                    ...details,
                    facilitator: e.target.value
                  })}
                />
              </div>
            )}
          </div>
        );

      case 'speaker':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Speaker Name</Label>
                <Input
                  value={details.speakerName || ''}
                  onChange={(e) => handleActivityDetailsChange('speaker', {
                    ...details,
                    speakerName: e.target.value
                  })}
                  placeholder="Speaker's full name"
                />
              </div>
              <div>
                <Label>Speaker Title</Label>
                <Input
                  value={details.speakerTitle || ''}
                  onChange={(e) => handleActivityDetailsChange('speaker', {
                    ...details,
                    speakerTitle: e.target.value
                  })}
                  placeholder="Professional title"
                />
              </div>
            </div>
            <div>
              <Label>Topic</Label>
              <Input
                value={details.topic || ''}
                onChange={(e) => handleActivityDetailsChange('speaker', {
                  ...details,
                  topic: e.target.value
                })}
                placeholder="Presentation topic"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={details.description || ''}
                onChange={(e) => handleActivityDetailsChange('speaker', {
                  ...details,
                  description: e.target.value
                })}
                placeholder="Brief description of the presentation"
                rows={3}
              />
            </div>
          </div>
        );

      case 'discussion':
        return (
          <div className="space-y-3">
            <div>
              <Label>Discussion Topic</Label>
              <Input
                value={details.discussionTopic || ''}
                onChange={(e) => handleActivityDetailsChange('discussion', {
                  ...details,
                  discussionTopic: e.target.value
                })}
                placeholder="What will be discussed?"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Discussion Type</Label>
                <Select
                  value={details.discussionType || 'plenary'}
                  onValueChange={(value) => handleActivityDetailsChange('discussion', {
                    ...details,
                    discussionType: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plenary">Plenary (Full Group)</SelectItem>
                    <SelectItem value="breakout">Breakout Groups</SelectItem>
                    <SelectItem value="group">Small Groups</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(details.discussionType === 'breakout' || details.discussionType === 'group') && (
                <div>
                  <Label>Group Size</Label>
                  <Input
                    type="number"
                    value={details.groupSize || ''}
                    onChange={(e) => handleActivityDetailsChange('discussion', {
                      ...details,
                      groupSize: parseInt(e.target.value) || 4
                    })}
                    placeholder="People per group"
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 'break':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Break Type</Label>
                <Select
                  value={details.breakType || 'tea'}
                  onValueChange={(value) => handleActivityDetailsChange('break', {
                    ...details,
                    breakType: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tea">Tea/Coffee Break</SelectItem>
                    <SelectItem value="lunch">Lunch Break</SelectItem>
                    <SelectItem value="stretch">Stretch Break</SelectItem>
                    <SelectItem value="mingling">Mingling Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  value={details.location || ''}
                  onChange={(e) => handleActivityDetailsChange('break', {
                    ...details,
                    location: e.target.value
                  })}
                  placeholder="Where will the break be?"
                />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={details.description || ''}
                onChange={(e) => handleActivityDetailsChange('break', {
                  ...details,
                  description: e.target.value
                })}
                placeholder="Additional details about the break"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>Start Time</Label>
          <Input
            type="time"
            value={timeslot.startTime}
            onChange={(e) => handleFieldChange('startTime', e.target.value)}
          />
        </div>
        <div>
          <Label>Duration (minutes)</Label>
          <Input
            type="number"
            value={timeslot.duration}
            onChange={(e) => handleFieldChange('duration', parseInt(e.target.value) || 0)}
            min="5"
            step="5"
          />
        </div>
        <div>
          <Label>Activity Type</Label>
          <Select
            value={timeslot.activityType}
            onValueChange={(value) => {
              handleFieldChange('activityType', value);
              // Reset activity details when type changes
              onChange({
                ...timeslot,
                activityType: value as any,
                activityDetails: { [value]: {} }
              });
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="module">Training Module</SelectItem>
              <SelectItem value="formality">Formality</SelectItem>
              <SelectItem value="speaker">Speaker/Presentation</SelectItem>
              <SelectItem value="discussion">Discussion</SelectItem>
              <SelectItem value="break">Break</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {renderActivityDetails()}

      <div>
        <Label>Notes</Label>
        <Textarea
          value={timeslot.notes || ''}
          onChange={(e) => handleFieldChange('notes', e.target.value)}
          placeholder="Additional notes for this timeslot"
          rows={2}
        />
      </div>
    </div>
  );
}

export function TimeSlotManager({
  timeslots,
  availableModules,
  onAddTimeslot,
  onUpdateTimeslot,
  onDeleteTimeslot,
  onReorderTimeslots
}: TimeSlotManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = timeslots.findIndex(slot => slot.sequenceNumber === active.id);
      const newIndex = timeslots.findIndex(slot => slot.sequenceNumber === over?.id);
      
      const newOrder = arrayMove(timeslots, oldIndex, newIndex);
      onReorderTimeslots(newOrder);
    }
  };

  const handleAddNewTimeslot = () => {
    const newSlot: Timeslot = {
      sequenceNumber: 0, // Will be set by parent
      startTime: '10:00',
      duration: 60,
      activityType: 'module',
      activityDetails: { module: {} },
      notes: ''
    };
    onAddTimeslot(newSlot);
    setShowAddForm(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Training Timeline
          </CardTitle>
          <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Activity
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={timeslots.map(slot => slot.sequenceNumber)}
            strategy={verticalListSortingStrategy}
          >
            {timeslots.map((timeslot, index) => (
              <SortableTimeslot
                key={timeslot.sequenceNumber}
                timeslot={timeslot}
                index={index}
                availableModules={availableModules}
                onUpdate={(updatedSlot) => onUpdateTimeslot(index, updatedSlot)}
                onDelete={() => onDeleteTimeslot(index)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {timeslots.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No activities added yet</p>
            <p className="text-sm">Click "Add Activity" to get started</p>
          </div>
        )}

        {showAddForm && (
          <div className="mt-4 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Quick Add Activity</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const slot: Timeslot = {
                    sequenceNumber: 0,
                    startTime: '10:00',
                    duration: 90,
                    activityType: 'module',
                    activityDetails: { module: {} }
                  };
                  onAddTimeslot(slot);
                  setShowAddForm(false);
                }}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Module
              </Button>
               <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const slot: Timeslot = {
                    sequenceNumber: 0,
                    startTime: '10:00',
                    duration: 10,
                    activityType: 'formality',
                    activityDetails: { formality: { formalityType: 'opening' } }
                  };
                  onAddTimeslot(slot);
                  setShowAddForm(false);
                }}
              >
                <Clock className="h-4 w-4 mr-2" />
                Formality
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const slot: Timeslot = {
                    sequenceNumber: 0,
                    startTime: '10:00',
                    duration: 45,
                    activityType: 'speaker',
                    activityDetails: { speaker: {} }
                  };
                  onAddTimeslot(slot);
                  setShowAddForm(false);
                }}
              >
                <User className="h-4 w-4 mr-2" />
                Speaker
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const slot: Timeslot = {
                    sequenceNumber: 0,
                    startTime: '10:00',
                    duration: 30,
                    activityType: 'discussion',
                    activityDetails: { discussion: { discussionType: 'plenary' } }
                  };
                  onAddTimeslot(slot);
                  setShowAddForm(false);
                }}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Discussion
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const slot: Timeslot = {
                    sequenceNumber: 0,
                    startTime: '10:00',
                    duration: 15,
                    activityType: 'break',
                    activityDetails: { break: { breakType: 'tea' } }
                  };
                  onAddTimeslot(slot);
                  setShowAddForm(false);
                }}
              >
                <Coffee className="h-4 w-4 mr-2" />
                Break
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}