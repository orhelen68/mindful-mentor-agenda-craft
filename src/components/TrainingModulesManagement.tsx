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
  const [filteredModules, setFilteredModules] = useState<TrainingModule[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [editingModule, setEditingModule] = useState<TrainingModule | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTags, setSearchTags] = useState<string>('');
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
      setFilteredModules(data);
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

  // Filter modules when filters change
  useEffect(() => {
    let filtered = modules;

    // Filter by category
    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter(module =>
        module.category.toLowerCase().includes(categoryFilter.toLowerCase())
      );
    }

    // Filter by tags
    if (searchTags.trim()) {
      const searchTerms = searchTags.toLowerCase().split(' ');
      filtered = filtered.filter(module => {
        const moduleTags = module.tags?.map(tag => tag.toLowerCase()) || [];
        return searchTerms.some(term =>
          moduleTags.some(tag => tag.includes(term)) ||
          module.moduleTitle.toLowerCase().includes(term) ||
          module.description.toLowerCase().includes(term)
        );
      });
    }

    setFilteredModules(filtered);
  }, [modules, categoryFilter, searchTags]);

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
        moduleTitle: data.module_title,
        description: data.description,
        facilitator: data.facilitator,
        participant: data.participant,
        category: data.category,
        tags: data.tags.map(tag => tag.value).filter(val => val.trim() !== ''),
        duration: data.duration,
        deliveryMethod: {
          format: data.delivery_method.format,
          breakout: data.delivery_method.breakout,
        },
        groupSize: {
          min: data.group_size.min,
          max: data.group_size.max,
          optimal: data.group_size.optimal,
        },
        mindsetTopics: data.mindset_topics.map(topic => topic.value).filter(val => val.trim() !== ''),
        deliveryNotes: data.delivery_notes,
        sampleMaterials: data.sample_materials?.filter(material =>
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
        moduleTitle: data.module_title,
        description: data.description,
        facilitator: data.facilitator,
        participant: data.participant,
        category: data.category,
        tags: data.tags.map(tag => tag.value).filter(val => val.trim() !== ''),
        duration: data.duration,
        deliveryMethod: {
          format: data.delivery_method.format,
          breakout: data.delivery_method.breakout,
        },
        groupSize: {
          min: data.group_size.min,
          max: data.group_size.max,
          optimal: data.group_size.optimal,
        },
        mindsetTopics: data.mindset_topics.map(topic => topic.value).filter(val => val.trim() !== ''),
        deliveryNotes: data.delivery_notes,
        sampleMaterials: data.sample_materials?.filter(material =>
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
      module_title: module.moduleTitle,
      description: module.description,
      facilitator: module.facilitator || '',
      participant: module.participant || '',
      category: module.category,
      tags: module.tags.map(tag => ({ value: tag })),
      duration: module.duration,
      delivery_method: {
        format: module.deliveryMethod.format,
        breakout: module.deliveryMethod.breakout as 'yes' | 'no',
      },
      group_size: {
        min: module.groupSize.min,
        max: module.groupSize.max,
        optimal: module.groupSize.optimal,
      },
      mindset_topics: module.mindsetTopics.map(topic => ({ value: topic })),
      delivery_notes: module.deliveryNotes || '',
      sample_materials: module.sampleMaterials || [],
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
                <FormLabel>Participant Notes</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Notes for participants..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (minutes)</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="number" 
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    placeholder="60" 
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
                <FormLabel>Format</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exercise">Exercise</SelectItem>
                      <SelectItem value="presentation">Presentation</SelectItem>
                      <SelectItem value="discussion">Discussion</SelectItem>
                      <SelectItem value="workshop">Workshop</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="delivery_method.breakout"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Breakout Sessions</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="group_size.min"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Min Group Size</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="number" 
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    placeholder="6" 
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
                    {...field} 
                    type="number" 
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    placeholder="20" 
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
                    {...field} 
                    type="number" 
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    placeholder="12" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <FormLabel>Tags</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendTag({ value: '' })}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Tag
            </Button>
          </div>
          <div className="space-y-2">
            {tagFields.map((field, index) => (
              <div key={`tag-${index}`} className="flex gap-2">
                <FormField
                  control={form.control}
                  name={`tags.${index}.value`}
                  render={({ field: inputField }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input {...inputField} placeholder="Enter tag..." />
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
                  className="bg-white border-gray-200 hover:bg-gray-50"
                >
                  <Trash2 className="w-4 h-4 text-green-600" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <FormLabel>Mindset Topics</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendMindset({ value: '' })}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Topic
            </Button>
          </div>
          <div className="space-y-2">
            {mindsetFields.map((field, index) => (
              <div key={`mindset-${index}`} className="flex gap-2">
                <FormField
                  control={form.control}
                  name={`mindset_topics.${index}.value`}
                  render={({ field: inputField }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input {...inputField} placeholder="Enter mindset topic..." />
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
                  className="bg-white border-gray-200 hover:bg-gray-50"
                >
                  <Trash2 className="w-4 h-4 text-green-600" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <FormField
          control={form.control}
          name="delivery_notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Delivery Notes</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Additional delivery notes..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => {
            setShowAddDialog(false);
            setEditingModule(null);
            form.reset();
          }}>
            Cancel
          </Button>
          <Button type="submit">
            {isEditing ? 'Update Module' : 'Add Module'}
          </Button>
        </div>
      </form>
    </Form>
  );

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-2xl p-6 border border-purple-100 dark:border-purple-800">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Training Module Library
            </h2>
            <p className="text-muted-foreground mt-1">Manage your training modules and resources</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => setShowAddDialog(true)} 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Module
            </Button>
            <Button 
              onClick={() => setShowAIGenerator(true)} 
              variant="outline" 
              className="bg-white/50 border-purple-200 hover:bg-purple-50"
            >
              <Brain className="w-4 h-4 mr-2" />
              AI Generate
            </Button>
            <Button 
              onClick={loadModules} 
              variant="outline" 
              className="bg-white/50 border-purple-200 hover:bg-purple-50"
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-100 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-blue-700 dark:text-blue-300 text-sm">Filter by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="bg-white/50 dark:bg-gray-800/50">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="leadership">Leadership</SelectItem>
                <SelectItem value="communication">Communication</SelectItem>
                <SelectItem value="teamwork">Teamwork</SelectItem>
                <SelectItem value="problem-solving">Problem Solving</SelectItem>
                <SelectItem value="creativity">Creativity</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-100 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-blue-700 dark:text-blue-300 text-sm">Search by Tags or Content</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search by tags, title, or description..."
              value={searchTags}
              onChange={(e) => setSearchTags(e.target.value)}
              className="bg-white/50 dark:bg-gray-800/50"
            />
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading modules...</div>
        </div>
      ) : filteredModules.length === 0 ? (
        <Card className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50 border-dashed border-2 border-gray-300 dark:border-gray-700">
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Training Modules Found</h3>
              <p className="text-muted-foreground mb-4">Create your first training module to get started.</p>
              <Button onClick={() => setShowAddDialog(true)} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Training Module
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModules.map((module) => (
            <Card key={module.id} className="hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3 bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-t-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-sm text-muted-foreground mb-1">
                      {module.category}
                    </div>
                    <CardTitle className="text-lg line-clamp-2 bg-gradient-to-r from-purple-700 to-pink-700 bg-clip-text text-transparent">
                      {module.moduleTitle}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-3">{module.description}</p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center text-sm bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 p-2 rounded-lg border border-orange-100 dark:border-orange-800">
                      <Clock className="w-4 h-4 mr-2 text-orange-600 dark:text-orange-400" />
                      <span className="text-orange-700 dark:text-orange-300">{formatDuration(module.duration)}</span>
                    </div>
                    <div className="flex items-center text-sm bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 p-2 rounded-lg border border-blue-100 dark:border-blue-800">
                      <Users className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                      <span className="text-blue-700 dark:text-cyan-300">{module.groupSize.optimal}</span>
                    </div>
                  </div>

                  {module.tags && module.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {module.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs border-purple-200 text-purple-700 dark:border-purple-700 dark:text-purple-300">
                          {tag}
                        </Badge>
                      ))}
                      {module.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">+{module.tags.length - 3}</Badge>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedModule(module)} className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-700 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/50 dark:hover:to-indigo-900/50">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
                          <DialogHeader className="border-b border-gray-100 dark:border-gray-700 pb-4">
                            <DialogTitle className="text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                              {selectedModule?.moduleTitle}
                            </DialogTitle>
                          </DialogHeader>
                          {selectedModule && (
                            <div className="space-y-6 pt-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-100 dark:border-blue-800">
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-blue-700 dark:text-blue-300 flex items-center">
                                      <BookOpen className="w-5 h-5 mr-2" />
                                      Module Details
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-3 text-sm">
                                    <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                                      <strong className="text-blue-600 dark:text-blue-400">Category:</strong> 
                                      <Badge className="ml-2 bg-gradient-to-r from-blue-300 to-sky-300 text-blue-800">{selectedModule.category}</Badge>
                                    </div>
                                    <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                                      <strong className="text-blue-600 dark:text-blue-400">Description:</strong> 
                                      <p className="mt-1">{selectedModule.description}</p>
                                    </div>
                                    {selectedModule.deliveryNotes && (
                                      <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                                        <strong className="text-blue-600 dark:text-blue-400">Delivery Notes:</strong> 
                                        <p className="mt-1">{selectedModule.deliveryNotes}</p>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>

                                <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-100 dark:border-orange-800">
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-orange-700 dark:text-orange-300 flex items-center">
                                      <Target className="w-5 h-5 mr-2" />
                                      Configuration
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-3 text-sm">
                                    <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                                      <strong className="text-orange-600 dark:text-orange-400">Duration:</strong> 
                                      <span className="ml-2">{formatDuration(selectedModule.duration)}</span>
                                    </div>
                                    <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                                      <strong className="text-orange-600 dark:text-orange-400">Format:</strong> 
                                      <Badge variant="outline" className="ml-2 border-purple-200 text-purple-700">{selectedModule.deliveryMethod.format}</Badge>
                                    </div>
                                    <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                                      <strong className="text-orange-600 dark:text-orange-400">Group Size:</strong> 
                                      <span className="ml-2">{selectedModule.groupSize.min}-{selectedModule.groupSize.max} (optimal: {selectedModule.groupSize.optimal})</span>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>

                              {selectedModule.mindsetTopics && selectedModule.mindsetTopics.length > 0 && (
                                <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-100 dark:border-purple-800">
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-purple-700 dark:text-purple-300 flex items-center">
                                      <Brain className="w-5 h-5 mr-2" />
                                      Topics & Tags
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="space-y-4">
                                      <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg">
                                        <h4 className="font-medium mb-3 text-purple-600 dark:text-purple-400">Topics</h4>
                                        <div className="flex flex-wrap gap-2">
                                          {selectedModule.mindsetTopics.map((topic, index) => (
                                            <Badge key={index} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">{topic}</Badge>
                                          ))}
                                        </div>
                                      </div>
                                      {selectedModule.tags && selectedModule.tags.length > 0 && (
                                        <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg">
                                          <h4 className="font-medium mb-3 text-purple-600 dark:text-purple-400">Tags</h4>
                                          <div className="flex flex-wrap gap-2">
                                            {selectedModule.tags.map((tag, index) => (
                                              <Badge key={index} variant="outline" className="text-xs border-purple-200 text-purple-600 dark:border-purple-700 dark:text-purple-300">{tag}</Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => startEdit(module)} 
                        className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-700 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/50 dark:hover:to-indigo-900/50"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </div>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          disabled={deleteLoading === module.id}
                          className="bg-white border-gray-200 hover:bg-gray-50"
                        >
                          {deleteLoading === module.id ? 'Deleting...' : <Trash2 className="w-4 h-4 text-green-600" />}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Training Module</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{module.moduleTitle}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(module.id)}>
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

      {/* Add Module Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Training Module</DialogTitle>
          </DialogHeader>
          <ModuleForm onSubmit={handleAdd} />
        </DialogContent>
      </Dialog>

      {/* Edit Module Dialog */}
      <Dialog open={!!editingModule} onOpenChange={(open) => !open && setEditingModule(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Training Module</DialogTitle>
          </DialogHeader>
          <ModuleForm onSubmit={handleEdit} isEditing />
        </DialogContent>
      </Dialog>

      {/* AI Generator Dialog */}
      {showAIGenerator && (
        <AIGeneratedModules 
          onBack={() => setShowAIGenerator(false)}
        />
      )}
    </div>
  );
}
