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
import { Plus, Trash2 } from 'lucide-react';
import { jsonBinService, TrainingRequirement } from '@/services/jsonbin';
import { useToast } from '@/hooks/use-toast';

const trainingRequirementsSchema = z.object({
  objective: z.object({
    mainGoal: z.string().min(1, 'Main goal is required'),
    specificOutcomes: z.array(z.string().min(1, 'Outcome cannot be empty')).min(1, 'At least one outcome is required'),
    industryContext: z.string().min(1, 'Industry context is required'),
  }),
  constraints: z.object({
    duration: z.number().min(1, 'Duration must be at least 1 minute'),
    interactionLevel: z.enum(['low', 'medium', 'high']),
  }),
  mindsetFocus: z.object({
    primaryMindset: z.string().min(1, 'Primary mindset is required'),
    secondaryMindsets: z.array(z.string()),
  }),
  targetAudience: z.object({
    roles: z.array(z.string().min(1, 'Role cannot be empty')).min(1, 'At least one role is required'),
    experienceLevel: z.enum(['beginner', 'intermediate', 'advanced', 'mixed']),
    teamSize: z.number().min(1, 'Team size must be at least 1'),
  }),
});

type TrainingRequirementsFormData = z.infer<typeof trainingRequirementsSchema>;

export function TrainingRequirementsForm({ onSuccess }: { onSuccess?: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<TrainingRequirementsFormData>({
    resolver: zodResolver(trainingRequirementsSchema),
    defaultValues: {
      objective: {
        mainGoal: '',
        specificOutcomes: [''],
        industryContext: '',
      },
      constraints: {
        duration: 480,
        interactionLevel: 'medium',
      },
      mindsetFocus: {
        primaryMindset: '',
        secondaryMindsets: [''],
      },
      targetAudience: {
        roles: [''],
        experienceLevel: 'intermediate',
        teamSize: 10,
      },
    },
  });

  const { fields: outcomeFields, append: appendOutcome, remove: removeOutcome } = useFieldArray({
    control: form.control,
    name: 'objective.specificOutcomes',
  });

  const { fields: mindsetFields, append: appendMindset, remove: removeMindset } = useFieldArray({
    control: form.control,
    name: 'mindsetFocus.secondaryMindsets',
  });

  const { fields: roleFields, append: appendRole, remove: removeRole } = useFieldArray({
    control: form.control,
    name: 'targetAudience.roles',
  });

  const onSubmit = async (data: TrainingRequirementsFormData) => {
    setIsSubmitting(true);
    try {
      await jsonBinService.addTrainingRequirement(data as any);
      toast({
        title: 'Success',
        description: 'Training requirements saved successfully!',
      });
      form.reset();
      onSuccess?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save training requirements. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Training Requirements</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Objective</h3>
              
              <FormField
                control={form.control}
                name="objective.mainGoal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Main Goal</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Describe the main goal of the training..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="objective.industryContext"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry Context</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Technology and startup companies" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>Specific Outcomes</FormLabel>
                {outcomeFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 mt-2">
                    <FormField
                      control={form.control}
                      name={`objective.specificOutcomes.${index}`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input {...field} placeholder="Enter specific outcome..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeOutcome(index)}
                      disabled={outcomeFields.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendOutcome('')}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Outcome
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Constraints</h3>
              
              <FormField
                control={form.control}
                name="constraints.duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
                    <FormLabel>Interaction Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
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
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Mindset Focus</h3>
              
              <FormField
                control={form.control}
                name="mindsetFocus.primaryMindset"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Mindset</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Growth mindset and adaptability" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>Secondary Mindsets</FormLabel>
                {mindsetFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 mt-2">
                    <FormField
                      control={form.control}
                      name={`mindsetFocus.secondaryMindsets.${index}`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input {...field} placeholder="Enter secondary mindset..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeMindset(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendMindset('')}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Mindset
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Target Audience</h3>
              
              <div>
                <FormLabel>Roles</FormLabel>
                {roleFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 mt-2">
                    <FormField
                      control={form.control}
                      name={`targetAudience.roles.${index}`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input {...field} placeholder="Enter role..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeRole(index)}
                      disabled={roleFields.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendRole('')}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Role
                </Button>
              </div>

              <FormField
                control={form.control}
                name="targetAudience.experienceLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Experience Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
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

              <FormField
                control={form.control}
                name="targetAudience.teamSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Size</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Saving...' : 'Save Training Requirements'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}