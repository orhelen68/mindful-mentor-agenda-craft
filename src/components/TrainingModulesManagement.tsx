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
  objectives: z.array(z.object({ value: z.string() })).min(1, 'At least one objective is required'),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  materials: z.array(z.object({ value: z.string() })),
  activities: z.array(activitySchema),
  tags: z.array(z.object({ value: z.string() })),
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
      objectives: [{ value: '' }],
      duration: 60,
      materials: [{ value: '' }],
      activities: [{ type: 'lecture' as const, description: '', duration: 30 }],
      tags: [{ value: '' }],
    },
  });

  const { fields: objectiveFields, append: appendObjective, remove: removeObjective } = useFieldArray({
    control: form.control,
    name: 'objectives' as const,
  });

  const { fields: materialFields, append: appendMaterial, remove: removeMaterial } = useFieldArray({
    control: form.control,
    name: 'materials' as const,
  });

  const { fields: activityFields, append: appendActivity, remove: removeActivity } = useFieldArray({
    control: form.control,
    name: 'activities' as const,
  });

  const { fields: tagFields, append: appendTag, remove: removeTag } = useFieldArray({
    control: form.control,
    name: 'tags' as const,
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
      // Filter out empty strings and convert to string arrays
      const cleanedData = {
        ...data,
        objectives: data.objectives.map(obj => obj.value).filter(val => val.trim() !== ''),
        materials: data.materials.map(mat => mat.value).filter(val => val.trim() !== ''),
        tags: data.tags.map(tag => tag.value).filter(val => val.trim() !== ''),
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
      // Filter out empty strings and convert to string arrays
      const cleanedData = {
        ...data,
        objectives: data.objectives.map(obj => obj.value).filter(val => val.trim() !== ''),
        materials: data.materials.map(mat => mat.value).filter(val => val.trim() !== ''),
        tags: data.tags.map(tag => tag.value).filter(val => val.trim() !== ''),
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
      objectives: module.objectives.map(obj => ({ value: obj })),
      duration: module.duration,
      materials: module.materials.map(mat => ({ value: mat })),
      activities: module.activities,
      tags: module.tags.map(tag => ({ value: tag })),
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
                name={`objectives.${index}.value` as const}
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
            onClick={() => appendObjective({ value: '' })}
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
                name={`materials.${index}.value` as const}
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
            onClick={() => appendMaterial({ value: '' })}
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
                  name={`activities.${index}.type` as const}
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
                  name={`activities.${index}.duration` as const}
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
                name={`activities.${index}.description` as const}
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
                name={`tags.${index}.value` as const}
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
            onClick={() => appendTag({ value: '' })}
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

      {/* View Details Dialog */}
      <Dialog open={!!selectedModule} onOpenChange={(open) => !open && setSelectedModule(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedModule?.title}</DialogTitle>
          </DialogHeader>
          {selectedModule && (
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-muted-foreground">{selectedModule.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Duration</h4>
                  <p className="text-muted-foreground">{formatDuration(selectedModule.duration)}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Activities Count</h4>
                  <p className="text-muted-foreground">{selectedModule.activities?.length || 0}</p>
                </div>
              </div>

              {selectedModule.objectives && selectedModule.objectives.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Objectives</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedModule.objectives.map((objective, index) => (
                      <li key={index} className="text-muted-foreground">{objective}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedModule.materials && selectedModule.materials.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Materials</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedModule.materials.map((material, index) => (
                      <li key={index} className="text-muted-foreground">{material}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedModule.activities && selectedModule.activities.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Activities</h4>
                  <div className="space-y-3">
                    {selectedModule.activities.map((activity, index) => (
                      <div key={index} className="border p-3 rounded">
                        <div className="flex justify-between items-center mb-2">
                          <Badge variant="outline">{activity.type}</Badge>
                          <span className="text-sm text-muted-foreground">
                            <Clock className="w-4 h-4 inline mr-1" />
                            {formatDuration(activity.duration)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedModule.tags && selectedModule.tags.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedModule.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => (
          <Card key={module.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                {module.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4 line-clamp-3">{module.description}</p>
              
              <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatDuration(module.duration)}
                </span>
                {module.activities && (
                  <span>{module.activities.length} activities</span>
                )}
              </div>

              {module.tags && module.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {module.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                  {module.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">+{module.tags.length - 3}</Badge>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedModule(module)}
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startEdit(module)}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Training Module</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{module.title}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(module.id)}
                        disabled={deleteLoading === module.id}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleteLoading === module.id ? 'Deleting...' : 'Delete'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {modules.length === 0 && !loading && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No training modules found</h3>
          <p className="text-muted-foreground mb-4">Get started by adding your first training module.</p>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add First Module
          </Button>
        </div>
      )}
    </div>
  );
}