import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Trash2, Eye, Edit, Plus, Clock, BookOpen, Brain, Users, Target } from 'lucide-react';
import { trainingModulesService, TrainingModule } from '@/services/trainingModulesService';
import { useToast } from '@/hooks/use-toast';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { AIGeneratedModules } from './AIGeneratedModules';

const trainingModuleSchema = z.object({
  module_title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  facilitator: z.string().optional(),
  participant: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.object({ value: z.string() })),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  delivery_method: z.object({
    format: z.string().min(1, 'Format is required'),
    breakout: z.enum(['yes', 'no']),
  }),
  group_size: z.object({
    min: z.number().min(1),
    max: z.number().min(1),
    optimal: z.number().min(1),
  }),
  mindset_topics: z.array(z.object({ value: z.string() })),
  delivery_notes: z.string().optional(),
  sample_materials: z.array(z.object({
    materialType: z.string(),
    filename: z.string(),
    fileFormat: z.string(),
    fileUrl: z.string(),
  })).optional(),
});

type TrainingModuleFormData = z.infer<typeof trainingModuleSchema>;

export function TrainingModulesManagement() {
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [editingModule, setEditingModule] = useState<TrainingModule | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const { toast } = useToast();

  const form = useForm<TrainingModuleFormData>({
    resolver: zodResolver(trainingModuleSchema),
    defaultValues: {
      module_title: '',
      description: '',
      facilitator: '',
      participant: '',
      category: '',
      tags: [{ value: '' }],
      duration: 60,
      delivery_method: {
        format: 'exercise',
        breakout: 'no',
      },
      group_size: {
        min: 6,
        max: 20,
        optimal: 12,
      },
      mindset_topics: [{ value: '' }],
      delivery_notes: '',
      sample_materials: [],
    },
  });

  const { fields: tagFields, append: appendTag, remove: removeTag } = useFieldArray({
    control: form.control,
    name: 'tags' as const,
  });

  const { fields: mindsetFields, append: appendMindset, remove: removeMindset } = useFieldArray({
    control: form.control,
    name: 'mindset_topics' as const,
  });

  const { fields: materialFields, append: appendMaterial, remove: removeMaterial } = useFieldArray({
    control: form.control,
    name: 'sample_materials' as const,
  });

  const loadModules = async () => {
    setLoading(true);
    try {
      const data = await trainingModulesService.getTrainingModules();
      setModules(data);
    } catch (error) {
      console.error('Error loading modules:', error);
      toast({
        title: "Error",
        description: "Failed to load training modules. Please check your authentication.",
        variant: "destructive",
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
      await trainingModulesService.deleteTrainingModule(id);
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
      // Clean up the data and ensure all required fields are present
      const cleanedData = {
        module_title: data.module_title,
        description: data.description,
        facilitator: data.facilitator,
        participant: data.participant,
        category: data.category,
        tags: data.tags.map(tag => tag.value).filter(val => val.trim() !== ''),
        duration: data.duration,
        delivery_method: {
          format: data.delivery_method.format,
          breakout: data.delivery_method.breakout,
        },
        group_size: {
          min: data.group_size.min,
          max: data.group_size.max,
          optimal: data.group_size.optimal,
        },
        mindset_topics: data.mindset_topics.map(topic => topic.value).filter(val => val.trim() !== ''),
        delivery_notes: data.delivery_notes,
        sample_materials: data.sample_materials?.filter(material => 
          material.materialType && material.filename && material.fileFormat && material.fileUrl
        ).map(material => ({
          materialType: material.materialType,
          filename: material.filename,
          fileFormat: material.fileFormat,
          fileUrl: material.fileUrl,
        })) || [],
      };
      
      await trainingModulesService.addTrainingModule(cleanedData);
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
      // Clean up the data and ensure all required fields are present
      const cleanedData = {
        module_title: data.module_title,
        description: data.description,
        facilitator: data.facilitator,
        participant: data.participant,
        category: data.category,
        tags: data.tags.map(tag => tag.value).filter(val => val.trim() !== ''),
        duration: data.duration,
        delivery_method: {
          format: data.delivery_method.format,
          breakout: data.delivery_method.breakout,
        },
        group_size: {
          min: data.group_size.min,
          max: data.group_size.max,
          optimal: data.group_size.optimal,
        },
        mindset_topics: data.mindset_topics.map(topic => topic.value).filter(val => val.trim() !== ''),
        delivery_notes: data.delivery_notes,
        sample_materials: data.sample_materials?.filter(material => 
          material.materialType && material.filename && material.fileFormat && material.fileUrl
        ).map(material => ({
          materialType: material.materialType,
          filename: material.filename,
          fileFormat: material.fileFormat,
          fileUrl: material.fileUrl,
        })) || [],
      };
      
      await trainingModulesService.updateTrainingModule(editingModule.id, cleanedData);
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
      module_title: module.module_title,
      description: module.description,
      facilitator: module.facilitator || '',
      participant: module.participant || '',
      category: module.category,
      tags: module.tags.map(tag => ({ value: tag })),
      duration: module.duration,
      delivery_method: {
        format: module.delivery_method.format,
        breakout: module.delivery_method.breakout as 'yes' | 'no',
      },
      group_size: {
        min: module.group_size.min,
        max: module.group_size.max,
        optimal: module.group_size.optimal,
      },
      mindset_topics: module.mindset_topics.map(topic => ({ value: topic })),
      delivery_notes: module.delivery_notes || '',
      sample_materials: module.sample_materials || [],
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="module_title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Module Title</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter module title..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g. Leadership Development" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="facilitator"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Facilitator Notes</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Notes for facilitator..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="participant"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Participant Information</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Information for participants..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <FormField
            control={form.control}
            name="delivery_method.format"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Delivery Format</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="exercise">Exercise</SelectItem>
                    <SelectItem value="lecture">Lecture</SelectItem>
                    <SelectItem value="discussion">Discussion</SelectItem>
                    <SelectItem value="game">Game</SelectItem>
                    <SelectItem value="workshop">Workshop</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="delivery_method.breakout"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Includes Breakout Sessions?</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select breakout option" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="group_size.min"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Min Group Size</FormLabel>
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
            name="group_size.optimal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Optimal Group Size</FormLabel>
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
            name="group_size.max"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Group Size</FormLabel>
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

        <div>
          <FormLabel>Mindset Topics</FormLabel>
          {mindsetFields.map((field, index) => (
            <div key={field.id} className="flex gap-2 mt-2">
              <FormField
                control={form.control}
                name={`mindset_topics.${index}.value` as const}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input {...field} placeholder="Enter mindset topic..." />
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
            onClick={() => appendMindset({ value: '' })}
            className="mt-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Mindset Topic
          </Button>
        </div>

        <FormField
          control={form.control}
          name="delivery_notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Delivery Notes</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Instructions for delivery..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
    <>
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
                  <Plus className="w-4 w-4 mr-2" />
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
              <DialogTitle>{selectedModule?.module_title}</DialogTitle>
            </DialogHeader>
            {selectedModule && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-muted-foreground">{selectedModule.description}</p>
                </div>

                {selectedModule.facilitator && (
                  <div>
                    <h4 className="font-semibold mb-2">Facilitator Notes</h4>
                    <p className="text-muted-foreground">{selectedModule.facilitator}</p>
                  </div>
                )}

                {selectedModule.participant && (
                  <div>
                    <h4 className="font-semibold mb-2">Participant Information</h4>
                    <p className="text-muted-foreground">{selectedModule.participant}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Duration</h4>
                    <p className="text-muted-foreground">{formatDuration(selectedModule.duration)}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Category</h4>
                    <p className="text-muted-foreground">{selectedModule.category}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Delivery Method</h4>
                    <p className="text-muted-foreground">
                      {selectedModule.delivery_method.format} 
                      {selectedModule.delivery_method.breakout === 'yes' && ' (with breakouts)'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Group Size</h4>
                    <p className="text-muted-foreground">
                      {selectedModule.group_size.min}-{selectedModule.group_size.max} 
                      (optimal: {selectedModule.group_size.optimal})
                    </p>
                  </div>
                </div>

                {selectedModule.mindset_topics && selectedModule.mindset_topics.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Mindset Topics</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedModule.mindset_topics.map((topic, index) => (
                        <Badge key={index} variant="outline">{topic}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedModule.delivery_notes && (
                  <div>
                    <h4 className="font-semibold mb-2">Delivery Notes</h4>
                    <p className="text-muted-foreground">{selectedModule.delivery_notes}</p>
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
                  {module.module_title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4 line-clamp-3">{module.description}</p>
                
                <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatDuration(module.duration)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {module.group_size.optimal}
                  </span>
                </div>

                <div className="mb-4">
                  <Badge variant="outline" className="text-xs mb-2">{module.category}</Badge>
                  {module.tags && module.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {module.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                      {module.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">+{module.tags.length - 3}</Badge>
                      )}
                    </div>
                  )}
                </div>

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
                          Are you sure you want to delete "{module.module_title}"? This action cannot be undone.
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
            <p className="text-muted-foreground mb-4">Get started by adding your first training module or load existing ones from the database.</p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Module
            </Button>
          </div>
        )}
      </div>
    </>
  );
}