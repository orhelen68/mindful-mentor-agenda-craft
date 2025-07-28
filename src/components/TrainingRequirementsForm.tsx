import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Brain, FileText, Target, BookOpen } from 'lucide-react';
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
        trainingID: data.trainingID,
        trainingTitle: data.trainingTitle,
        description: data.description,
        targetAudience: {
          experienceLevel: data.targetAudience.experienceLevel,
          industryContext: data.targetAudience.industryContext,
        },
        constraints: {
          duration: data.constraints.duration,
          interactionLevel: data.constraints.interactionLevel,
        },
        mindsetFocus: {
          learningObjectives: data.mindsetFocus.learningObjectives.map(obj => obj.value).filter(val => val.trim() !== ''),
          primaryTopics: data.mindsetFocus.primaryTopics.map(topic => topic.value).filter(val => val.trim() !== ''),
          secondaryTopics: data.mindsetFocus.secondaryTopics.map(topic => topic.value).filter(val => val.trim() !== ''),
        },
        deliveryPreferences: {
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
      // Set the dialog to close first
      setShowAIDialog(false);
      
      // Store the agenda data temporarily for the create agenda page to use
      sessionStorage.setItem('aiGeneratedAgenda', JSON.stringify(agenda));
      
      toast({
        title: "AI Agenda Ready!",
        description: "Review and save your AI-generated agenda.",
      });
      
      // Navigate to create agenda page with the requirement ID
      // Use a small delay to ensure the sessionStorage is written before navigation
      setTimeout(() => {
        if (savedRequirement?.id) {
          window.location.href = `/create-agenda/${savedRequirement.id}`;
        } else {
          window.location.href = '/create-agenda';
        }
      }, 100);
    } catch (error) {
      console.error('Error handling AI agenda:', error);
      toast({
        title: "Error",
        description: "Failed to process the AI-generated agenda.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-2xl p-6 border border-green-100 dark:border-green-800">
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Add Training Requirements
          </h1>
          <p className="text-muted-foreground mt-2">Define your training objectives and constraints</p>
        </div>
      </div>
      
      <Card className="shadow-xl bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 border-gray-200 dark:border-gray-700">
        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-100 dark:border-blue-800">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-blue-700 dark:text-blue-300 flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="trainingID"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Training ID</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., T001" className="h-11 bg-white/50 dark:bg-gray-800/50" />
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
                            <Input {...field} placeholder="e.g., Leadership Mindset for New Managers" className="h-11 bg-white/50 dark:bg-gray-800/50" />
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
                            <Textarea {...field} placeholder="Describe the training program..." className="min-h-[100px] bg-white/50 dark:bg-gray-800/50" />
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
                            <Input {...field} placeholder="e.g., Technology and startup companies" className="h-11 bg-white/50 dark:bg-gray-800/50" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-100 dark:border-orange-800">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-orange-700 dark:text-orange-300 flex items-center">
                      <Target className="w-5 h-5 mr-2" />
                      Constraints & Delivery
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
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
                              className="h-11 bg-white/50 dark:bg-gray-800/50"
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
                              <SelectTrigger className="h-11 bg-white/50 dark:bg-gray-800/50">
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
                              <SelectTrigger className="h-11 bg-white/50 dark:bg-gray-800/50">
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
                                <SelectTrigger className="h-11 bg-white/50 dark:bg-gray-800/50">
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
                                className="h-11 bg-white/50 dark:bg-gray-800/50"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-100 dark:border-purple-800">
                <CardHeader className="pb-4">
                  <CardTitle className="text-purple-700 dark:text-purple-300 flex items-center">
                    <Brain className="w-5 h-5 mr-2" />
                    Learning Objectives
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="space-y-3">
                      {objectiveFields.map((field, index) => (
                        <div key={field.id} className="flex gap-3">
                          <FormField
                            control={form.control}
                            name={`mindsetFocus.learningObjectives.${index}.value` as const}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Input {...field} placeholder="Enter learning objective..." className="h-11 bg-white/50 dark:bg-gray-800/50" />
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
                            className="h-11 w-11 bg-white border-gray-200 hover:bg-gray-50"
                          >
                            <Trash2 className="h-4 w-4 text-green-600" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => appendObjective({ value: '' })}
                        className="w-full bg-white/50 border-purple-200 hover:bg-purple-50"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Learning Objective
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20 border-teal-100 dark:border-teal-800">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-teal-700 dark:text-teal-300 flex items-center">
                      <Target className="w-5 h-5 mr-2" />
                      Primary Topics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {primaryTopicFields.map((field, index) => (
                        <div key={field.id} className="flex gap-3">
                          <FormField
                            control={form.control}
                            name={`mindsetFocus.primaryTopics.${index}.value` as const}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Input {...field} placeholder="Enter primary topic..." className="h-11 bg-white/50 dark:bg-gray-800/50" />
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
                            className="h-11 w-11 bg-white border-gray-200 hover:bg-gray-50"
                          >
                            <Trash2 className="h-4 w-4 text-green-600" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => appendPrimaryTopic({ value: '' })}
                        className="w-full bg-white/50 border-teal-200 hover:bg-teal-50"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Primary Topic
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/20 dark:to-gray-950/20 border-slate-100 dark:border-slate-800">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-slate-700 dark:text-slate-300 flex items-center">
                      <BookOpen className="w-5 h-5 mr-2" />
                      Secondary Topics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {secondaryTopicFields.map((field, index) => (
                        <div key={field.id} className="flex gap-3">
                          <FormField
                            control={form.control}
                            name={`mindsetFocus.secondaryTopics.${index}.value` as const}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Input {...field} placeholder="Enter secondary topic..." className="h-11 bg-white/50 dark:bg-gray-800/50" />
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
                            className="h-11 w-11 bg-white border-gray-200 hover:bg-gray-50"
                          >
                            <Trash2 className="h-4 w-4 text-green-600" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => appendSecondaryTopic({ value: '' })}
                        className="w-full bg-white/50 border-slate-200 hover:bg-slate-50"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Secondary Topic
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-center gap-4 pt-6 border-t border-gray-100 dark:border-gray-700">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white min-w-[200px]"
                >
                  {isSubmitting ? 'Saving...' : 'Save Requirements'}
                </Button>
                {savedRequirement && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAIDialog(true)}
                    className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-700 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/50 dark:hover:to-pink-900/50 min-w-[200px]"
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    Generate AI Agenda
                  </Button>
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