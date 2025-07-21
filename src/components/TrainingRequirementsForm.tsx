import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Brain } from 'lucide-react';
import { trainingRequirementsService, TrainingRequirement } from '@/services/trainingRequirementsService';
import { trainingModulesService, TrainingModule } from '@/services/trainingModulesService';
import { trainingAgendasService, TrainingAgendaFormData } from '@/services/trainingAgendasService';
import { AIGeneratedAgendaDialog } from '@/components/AIGeneratedAgendaDialog';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

const trainingRequirementsSchema = z.object({
  trainingID: z.string().min(1, 'Training ID is required'),
  trainingTitle: z.string().min(1, 'Training title is required'),
  description: z.string().min(1, 'Description is required'),
  targetAudience: z.object({
    experienceLevel: z.enum(['beginner', 'intermediate', 'advanced', 'mixed']),
    industryContext: z.string().min(1, 'Industry context is required'),
  }),
  constraints: z.object({
    duration: z.number().min(1, 'Duration must be at least 1 minute'),
    interactionLevel: z.enum(['low', 'medium', 'high']),
  }),
  mindsetFocus: z.object({
    learningObjectives: z.array(z.object({ value: z.string() })).min(1, 'At least one objective is required'),
    primaryTopics: z.array(z.object({ value: z.string() })).min(1, 'At least one primary topic is required'),
    secondaryTopics: z.array(z.object({ value: z.string() })),
  }),
  deliveryPreferences: z.object({
    format: z.enum(['in-person', 'virtual', 'hybrid']),
    groupSize: z.number().min(1, 'Group size must be at least 1'),
  }),
});

type TrainingRequirementsFormData = z.infer<typeof trainingRequirementsSchema>;

export function TrainingRequirementsForm({ onSuccess }: { onSuccess?: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [availableModules, setAvailableModules] = useState<TrainingModule[]>([]);
  const [savedRequirement, setSavedRequirement] = useState<TrainingRequirement | null>(null);
  const { toast } = useToast();

  const form = useForm<TrainingRequirementsFormData>({
    resolver: zodResolver(trainingRequirementsSchema),
    defaultValues: {
      trainingID: '',
      trainingTitle: '',
      description: '',
      targetAudience: {
        experienceLevel: 'intermediate' as const,
        industryContext: '',
      },
      constraints: {
        duration: 480,
        interactionLevel: 'medium' as const,
      },
      mindsetFocus: {
        learningObjectives: [{ value: '' }],
        primaryTopics: [{ value: '' }],
        secondaryTopics: [{ value: '' }],
      },
      deliveryPreferences: {
        format: 'in-person' as const,
        groupSize: 10,
      },
    },
  });

  const { fields: objectiveFields, append: appendObjective, remove: removeObjective } = useFieldArray({
    control: form.control,
    name: 'mindsetFocus.learningObjectives' as const,
  });

  const { fields: primaryTopicFields, append: appendPrimaryTopic, remove: removePrimaryTopic } = useFieldArray({
    control: form.control,
    name: 'mindsetFocus.primaryTopics' as const,
  });

  const { fields: secondaryTopicFields, append: appendSecondaryTopic, remove: removeSecondaryTopic } = useFieldArray({
    control: form.control,
    name: 'mindsetFocus.secondaryTopics' as const,
  });

  // Load available modules for AI generation
  const loadModules = async () => {
    try {
      const modules = await trainingModulesService.getTrainingModules();
      setAvailableModules(modules);
    } catch (error) {
      console.error('Failed to load modules:', error);
    }
  };

  // Load modules on component mount
  useEffect(() => {
    loadModules();
  }, []);

  const onSubmit = async (data: TrainingRequirementsFormData) => {
    setIsSubmitting(true);
    try {
      // Transform data to match service interface
      const serviceData = {
        training_id: data.trainingID,
        training_title: data.trainingTitle,
        description: data.description,
        target_audience: {
          experienceLevel: data.targetAudience.experienceLevel,
          industryContext: data.targetAudience.industryContext,
        },
        constraints: {
          duration: data.constraints.duration,
          interactionLevel: data.constraints.interactionLevel,
        },
        mindset_focus: {
          learningObjectives: data.mindsetFocus.learningObjectives.map(obj => obj.value).filter(val => val.trim() !== ''),
          primaryTopics: data.mindsetFocus.primaryTopics.map(topic => topic.value).filter(val => val.trim() !== ''),
          secondaryTopics: data.mindsetFocus.secondaryTopics.map(topic => topic.value).filter(val => val.trim() !== ''),
        },
        delivery_preferences: {
          format: data.deliveryPreferences.format,
          groupSize: data.deliveryPreferences.groupSize,
        },
      };
      
      const savedData = await trainingRequirementsService.addTrainingRequirement(serviceData);
      setSavedRequirement(savedData);
      
      toast({
        title: 'Success',
        description: 'Training requirements saved successfully!',
      });
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error saving requirements:', error);
      toast({
        title: 'Error',
        description: 'Failed to save training requirements. Please check your connection.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAIAgendaGenerated = async (agenda: Omit<TrainingAgendaFormData, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await trainingAgendasService.addTrainingAgenda(agenda);
      toast({
        title: "AI Agenda Created!",
        description: "Your training agenda has been generated and saved successfully.",
      });
      // Navigate to view the created agenda
      window.location.href = '/create-agenda';
    } catch (error) {
      toast({
        title: "Error saving agenda",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Training Requirements
        </h1>
        <p className="text-muted-foreground mt-2">Define your training objectives and constraints</p>
      </div>
      
      <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="trainingID"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">Training ID</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., T001" className="h-11" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="trainingTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">Training Title</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Leadership Mindset for New Managers" className="h-11" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Describe the training program..." className="min-h-[100px]" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetAudience.industryContext"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">Industry Context</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Technology and startup companies" className="h-11" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="constraints.duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">Duration (minutes)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            className="h-11"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="constraints.interactionLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">Interaction Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select interaction level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetAudience.experienceLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">Experience Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select experience level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                            <SelectItem value="mixed">Mixed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="deliveryPreferences.format"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Format</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Format" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="in-person">In-Person</SelectItem>
                              <SelectItem value="virtual">Virtual</SelectItem>
                              <SelectItem value="hybrid">Hybrid</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="deliveryPreferences.groupSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Group Size</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              className="h-11"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <FormLabel className="text-lg font-semibold">Learning Objectives</FormLabel>
                  <div className="mt-3 space-y-3">
                    {objectiveFields.map((field, index) => (
                      <div key={field.id} className="flex gap-3">
                        <FormField
                          control={form.control}
                          name={`mindsetFocus.learningObjectives.${index}.value` as const}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input {...field} placeholder="Enter learning objective..." className="h-11" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeObjective(index)}
                          disabled={objectiveFields.length === 1}
                          className="h-11 w-11"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => appendObjective({ value: '' })}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Learning Objective
                    </Button>
                  </div>
                </div>

                <div>
                  <FormLabel className="text-lg font-semibold">Primary Topics</FormLabel>
                  <div className="mt-3 space-y-3">
                    {primaryTopicFields.map((field, index) => (
                      <div key={field.id} className="flex gap-3">
                        <FormField
                          control={form.control}
                          name={`mindsetFocus.primaryTopics.${index}.value` as const}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input {...field} placeholder="Enter primary topic..." className="h-11" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removePrimaryTopic(index)}
                          disabled={primaryTopicFields.length === 1}
                          className="h-11 w-11"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => appendPrimaryTopic({ value: '' })}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Primary Topic
                    </Button>
                  </div>
                </div>

                <div>
                  <FormLabel className="text-lg font-semibold">Secondary Topics</FormLabel>
                  <div className="mt-3 space-y-3">
                    {secondaryTopicFields.map((field, index) => (
                      <div key={field.id} className="flex gap-3">
                        <FormField
                          control={form.control}
                          name={`mindsetFocus.secondaryTopics.${index}.value` as const}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input {...field} placeholder="Enter secondary topic..." className="h-11" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeSecondaryTopic(index)}
                          className="h-11 w-11"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => appendSecondaryTopic({ value: '' })}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Secondary Topic
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button type="submit" disabled={isSubmitting} className="w-full h-12 text-lg">
                  {isSubmitting ? 'Saving...' : 'Save Training Requirements'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full h-12 text-lg"
                  onClick={() => window.location.href = '/create-agenda'}
                >
                  Create Training Agenda
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full h-12 text-lg bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 hover:from-purple-100 hover:to-blue-100"
                  onClick={() => setShowAIDialog(true)}
                  disabled={!savedRequirement}
                >
                  <Brain className="h-5 w-5 mr-2" />
                  AI Generate Training Agenda
                </Button>
                {!savedRequirement && (
                  <p className="text-xs text-muted-foreground text-center">
                    Save training requirements first to enable AI generation
                  </p>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <AIGeneratedAgendaDialog
        open={showAIDialog}
        onOpenChange={setShowAIDialog}
        requirement={savedRequirement}
        availableModules={availableModules}
        onAgendaGenerated={handleAIAgendaGenerated}
      />
    </div>
  );
}