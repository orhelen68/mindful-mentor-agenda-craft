import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Trash2, Eye, Edit, Plus, Clock, BookOpen, Brain } from 'lucide-react';
import { jsonBinService, TrainingModule } from '@/services/jsonbin';
import { useToast } from '@/hooks/use-toast';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { AIGeneratedModules } from './AIGeneratedModules';

const activitySchema = z.object({
  type: z.enum(['lecture', 'discussion', 'exercise', 'case_study', 'role_play']),
  description: z.string().min(1, 'Description is required'),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
});

const trainingModuleSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  objectives: z.array(z.string()).min(1, 'At least one objective is required'),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  materials: z.array(z.string()),
  activities: z.array(activitySchema),
  tags: z.array(z.string()),
});

type TrainingModuleFormData = z.infer<typeof trainingModuleSchema>;

export function TrainingModulesManagement() {
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [editingModule, setEditingModule] = useState<TrainingModule | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const { toast } = useToast();

  const form = useForm<TrainingModuleFormData>({
    resolver: zodResolver(trainingModuleSchema),
    defaultValues: {
      title: '',
      description: '',
      objectives: [''],
      duration: 60,
      materials: [''],
      activities: [{ type: 'lecture' as const, description: '', duration: 30 }],
      tags: [''],
    },
  });

  const { fields: objectiveFields, append: appendObjective, remove: removeObjective } = useFieldArray({
    control: form.control,
    name: 'objectives',
  });

  const { fields: materialFields, append: appendMaterial, remove: removeMaterial } = useFieldArray({
    control: form.control,
    name: 'materials',
  });

  const { fields: activityFields, append: appendActivity, remove: removeActivity } = useFieldArray({
    control: form.control,
    name: 'activities',
  });

  const { fields: tagFields, append: appendTag, remove: removeTag } = useFieldArray({
    control: form.control,
    name: 'tags',
  });

  const loadModules = async () => {
    try {
      const data = await jsonBinService.getTrainingModules();
      setModules(data);
    } catch (error) {
      console.error('Error loading modules:', error);
      toast({
        title: 'Error',
        description: 'Failed to load training modules. Please check your internet connection.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModules();
  }, []);

  const handleDelete = async (id: string) => {
    setDeleteLoading(id);
    try {
      await jsonBinService.deleteTrainingModule(id);
      setModules(prev => prev.filter(mod => mod.id !== id));
      toast({
        title: 'Success',
        description: 'Training module deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete training module',
        variant: 'destructive',
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleAdd = async (data: TrainingModuleFormData) => {
    try {
      // Filter out empty strings
      const cleanedData = {
        ...data,
        objectives: data.objectives.filter(obj => obj.trim() !== ''),
        materials: data.materials.filter(mat => mat.trim() !== ''),
        tags: data.tags.filter(tag => tag.trim() !== ''),
      };
      
      await jsonBinService.addTrainingModule(cleanedData as Omit<TrainingModule, 'id' | 'createdAt' | 'updatedAt'>);
      await loadModules();
      setShowAddDialog(false);
      form.reset();
      toast({
        title: 'Success',
        description: 'Training module added successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add training module',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = async (data: TrainingModuleFormData) => {
    if (!editingModule) return;
    
    try {
      // Filter out empty strings
      const cleanedData = {
        ...data,
        objectives: data.objectives.filter(obj => obj.trim() !== ''),
        materials: data.materials.filter(mat => mat.trim() !== ''),
        tags: data.tags.filter(tag => tag.trim() !== ''),
      };
      
      await jsonBinService.updateTrainingModule(editingModule.id, cleanedData as Partial<TrainingModule>);
      await loadModules();
      setEditingModule(null);
      form.reset();
      toast({
        title: 'Success',
        description: 'Training module updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update training module',
        variant: 'destructive',
      });
    }
  };

  const startEdit = (module: TrainingModule) => {
    setEditingModule(module);
    form.reset({
      title: module.title,
      description: module.description,
      objectives: module.objectives,
      duration: module.duration,
      materials: module.materials,
      activities: module.activities,
      tags: module.tags,
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  const ModuleForm = ({ onSubmit, isEditing = false }: { onSubmit: (data: TrainingModuleFormData) => void; isEditing?: boolean }) => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Module title..." />
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
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Module description..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="duration"
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

        <div>
          <FormLabel>Objectives</FormLabel>
          {objectiveFields.map((field, index) => (
            <div key={field.id} className="flex gap-2 mt-2">
              <FormField
                control={form.control}
                name={`objectives.${index}`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input {...field} placeholder="Enter objective..." />
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
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendObjective('')}
            className="mt-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Objective
          </Button>
        </div>

        <div>
          <FormLabel>Materials</FormLabel>
          {materialFields.map((field, index) => (
            <div key={field.id} className="flex gap-2 mt-2">
              <FormField
                control={form.control}
                name={`materials.${index}`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input {...field} placeholder="Enter material..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeMaterial(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendMaterial('')}
            className="mt-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Material
          </Button>
        </div>

        <div>
          <FormLabel>Activities</FormLabel>
          {activityFields.map((field, index) => (
            <div key={field.id} className="border p-4 rounded-md mt-2">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name={`activities.${index}.type`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select activity type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="lecture">Lecture</SelectItem>
                          <SelectItem value="discussion">Discussion</SelectItem>
                          <SelectItem value="exercise">Exercise</SelectItem>
                          <SelectItem value="case_study">Case Study</SelectItem>
                          <SelectItem value="role_play">Role Play</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name={`activities.${index}.duration`}
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
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name={`activities.${index}.description`}
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Activity description..." />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeActivity(index)}
                className="mt-2"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Activity
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendActivity({ type: 'lecture' as const, description: '', duration: 30 })}
            className="mt-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Activity
          </Button>
        </div>

        <div>
          <FormLabel>Tags</FormLabel>
          {tagFields.map((field, index) => (
            <div key={field.id} className="flex gap-2 mt-2">
              <FormField
                control={form.control}
                name={`tags.${index}`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input {...field} placeholder="Enter tag..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeTag(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendTag('')}
            className="mt-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Tag
          </Button>
        </div>

        <Button type="submit" className="w-full">
          {isEditing ? 'Update Module' : 'Add Module'}
        </Button>
      </form>
    </Form>
  );

  if (showAIGenerator) {
    return <AIGeneratedModules onBack={() => setShowAIGenerator(false)} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading training modules...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Training Modules Management</h2>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowAIGenerator(!showAIGenerator)}
            variant={showAIGenerator ? "default" : "outline"}
          >
            <Brain className="w-4 h-4 mr-2" />
            AI Generated Modules
          </Button>
          <Button onClick={loadModules} variant="outline">
            Refresh
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Module
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Training Module</DialogTitle>
              </DialogHeader>
              <ModuleForm onSubmit={handleAdd} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingModule} onOpenChange={(open) => !open && setEditingModule(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Training Module</DialogTitle>
          </DialogHeader>
          <ModuleForm onSubmit={handleEdit} isEditing />
        </DialogContent>
      </Dialog>

      {modules.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No Training Modules Found</h3>
              <p className="text-muted-foreground">Create your first training module to get started.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {modules.map((module) => (
            <Card key={module.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      {module.title}
                    </CardTitle>
                    <p className="text-muted-foreground mt-1">{module.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(module.duration)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-2">Learning Objectives:</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {module.objectives.map((objective, index) => (
                        <li key={index}>{objective}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {module.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{module.title}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6">
                          <div>
                            <h3 className="font-semibold mb-2">Description</h3>
                            <p className="text-muted-foreground">{module.description}</p>
                          </div>
                          
                          <div>
                            <h3 className="font-semibold mb-2">Learning Objectives</h3>
                            <ul className="list-disc list-inside space-y-1">
                              {module.objectives.map((objective, index) => (
                                <li key={index}>{objective}</li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <h3 className="font-semibold mb-2">Materials</h3>
                            <ul className="list-disc list-inside space-y-1">
                              {module.materials.map((material, index) => (
                                <li key={index}>{material}</li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <h3 className="font-semibold mb-2">Activities</h3>
                            <div className="space-y-3">
                              {module.activities.map((activity, index) => (
                                <div key={index} className="border p-3 rounded">
                                  <div className="flex justify-between items-center mb-2">
                                    <Badge variant="secondary">{activity.type.replace('_', ' ')}</Badge>
                                    <span className="text-sm text-muted-foreground">{activity.duration} min</span>
                                  </div>
                                  <p className="text-sm">{activity.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="font-semibold mb-2">Tags</h3>
                            <div className="flex flex-wrap gap-2">
                              {module.tags.map((tag, index) => (
                                <Badge key={index} variant="outline">{tag}</Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div className="text-xs text-muted-foreground">
                            Created: {new Date(module.createdAt).toLocaleDateString()}
                            {module.updatedAt !== module.createdAt && (
                              <> • Updated: {new Date(module.updatedAt).toLocaleDateString()}</>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => startEdit(module)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={deleteLoading === module.id}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the training module
                            "{module.title}" and remove it from the database.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(module.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}