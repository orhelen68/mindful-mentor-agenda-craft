import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Trash2, Eye, FileText, Clock, Users, Target, Plus, Zap, Calendar } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trainingRequirementsService, TrainingRequirement } from '@/services/trainingRequirementsService';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { AIGeneratedAgendaDialog } from '@/components/AIGeneratedAgendaDialog';

export function TrainingRequirementsManagement() {
  const [requirements, setRequirements] = useState<TrainingRequirement[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<TrainingRequirement | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const loadRequirements = async () => {
    setLoading(true);
    try {
      const data = await trainingRequirementsService.getTrainingRequirements();
      setRequirements(data);
    } catch (error) {
      console.error('Error loading requirements:', error);
      toast({
        title: "Error",
        description: "Failed to load training requirements.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequirements();
  }, []);

  const handleDelete = async (id: string) => {
    setDeleteLoading(id);
    try {
      await trainingRequirementsService.deleteTrainingRequirement(id);
      setRequirements(prev => prev.filter(req => req.id !== id));
      toast({
        title: 'Success',
        description: 'Training requirement deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete training requirement',
        variant: 'destructive',
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Propose Training Agenda
            </h2>
            <p className="text-muted-foreground mt-1">Manage your training requirements and create agendas</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => navigate('/?tab=add-requirements')} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Training Requirements
            </Button>
            <Button onClick={loadRequirements} variant="outline" className="bg-white/50 border-blue-200 hover:bg-blue-50">
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading training requirements...</div>
        </div>
      ) : requirements.length === 0 ? (
        <Card className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50 border-dashed border-2 border-gray-300 dark:border-gray-700">
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center">
                <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Training Requirements Found</h3>
              <p className="text-muted-foreground mb-4">
                Create your first training requirement using the form to get started.
              </p>
              <Button onClick={() => navigate('/?tab=add-requirements')} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Training Requirements
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requirements.map((requirement) => (
            <Card key={requirement.id} className="hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-t-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2 bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                      {requirement.training_title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1 font-mono">ID: {requirement.training_id}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Badge className="mb-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0">
                      {requirement.target_audience.experienceLevel}
                    </Badge>
                    <Badge variant="outline" className="border-purple-200 text-purple-700 dark:border-purple-700 dark:text-purple-300">
                      {requirement.delivery_preferences.format}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-3">{requirement.description}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center text-sm bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 p-2 rounded-lg border border-orange-100 dark:border-orange-800">
                        <Clock className="w-4 h-4 mr-2 text-orange-600 dark:text-orange-400" />
                        <span className="text-orange-700 dark:text-orange-300">{formatDuration(requirement.constraints.duration)}</span>
                      </div>
                      <div className="flex items-center text-sm bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 p-2 rounded-lg border border-blue-100 dark:border-blue-800">
                        <Users className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                        <span className="text-blue-700 dark:text-cyan-300">{requirement.delivery_preferences.groupSize}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-700">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedRequirement(requirement)} className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-700 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/50 dark:hover:to-indigo-900/50">
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
                          <DialogHeader className="border-b border-gray-100 dark:border-gray-700 pb-4">
                            <DialogTitle className="text-2xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                              {selectedRequirement?.training_title}
                            </DialogTitle>
                            <div className="flex gap-3 mt-4">
                              <Button 
                                onClick={() => navigate(`/create-agenda/${selectedRequirement?.id}`)}
                                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                              >
                                <Calendar className="w-4 h-4 mr-2" />
                                Create Training Agenda
                              </Button>
                              <Button 
                                onClick={() => setAiDialogOpen(true)}
                                variant="outline"
                                className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-700 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/50 dark:hover:to-pink-900/50"
                              >
                                <Zap className="w-4 h-4 mr-2" />
                                AI Generate Training Agenda
                              </Button>
                            </div>
                          </DialogHeader>
                          {selectedRequirement && (
                            <div className="space-y-6 pt-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-100 dark:border-blue-800">
                                  <CardHeader className="pb-3">
                                    <h3 className="font-semibold flex items-center text-blue-700 dark:text-blue-300">
                                      <FileText className="w-5 h-5 mr-2" />
                                      Basic Information
                                    </h3>
                                  </CardHeader>
                                  <CardContent className="space-y-3 text-sm">
                                    <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                                      <strong className="text-blue-600 dark:text-blue-400">ID:</strong> 
                                      <span className="ml-2 font-mono">{selectedRequirement.training_id}</span>
                                    </div>
                                    <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                                      <strong className="text-blue-600 dark:text-blue-400">Description:</strong> 
                                      <p className="mt-1">{selectedRequirement.description}</p>
                                    </div>
                                    <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                                      <strong className="text-blue-600 dark:text-blue-400">Industry:</strong> 
                                      <span className="ml-2">{selectedRequirement.target_audience.industryContext}</span>
                                    </div>
                                    <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                                      <strong className="text-blue-600 dark:text-blue-400">Experience Level:</strong> 
                                      <Badge className="ml-2 bg-gradient-to-r from-emerald-500 to-teal-500">{selectedRequirement.target_audience.experienceLevel}</Badge>
                                    </div>
                                  </CardContent>
                                </Card>
                                <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-100 dark:border-orange-800">
                                  <CardHeader className="pb-3">
                                    <h3 className="font-semibold flex items-center text-orange-700 dark:text-orange-300">
                                      <Clock className="w-5 h-5 mr-2" />
                                      Constraints & Delivery
                                    </h3>
                                  </CardHeader>
                                  <CardContent className="space-y-3 text-sm">
                                    <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                                      <strong className="text-orange-600 dark:text-orange-400">Duration:</strong> 
                                      <span className="ml-2">{formatDuration(selectedRequirement.constraints.duration)}</span>
                                    </div>
                                    <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                                      <strong className="text-orange-600 dark:text-orange-400">Interaction Level:</strong> 
                                      <span className="ml-2">{selectedRequirement.constraints.interactionLevel}</span>
                                    </div>
                                    <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                                      <strong className="text-orange-600 dark:text-orange-400">Format:</strong> 
                                      <Badge variant="outline" className="ml-2 border-purple-200 text-purple-700">{selectedRequirement.delivery_preferences.format}</Badge>
                                    </div>
                                    <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                                      <strong className="text-orange-600 dark:text-orange-400">Group Size:</strong> 
                                      <span className="ml-2">{selectedRequirement.delivery_preferences.groupSize} participants</span>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>

                              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-100 dark:border-purple-800">
                                <CardHeader className="pb-3">
                                  <h3 className="font-semibold flex items-center text-purple-700 dark:text-purple-300">
                                    <Target className="w-5 h-5 mr-2" />
                                    Learning Objectives & Topics
                                  </h3>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg">
                                    <h4 className="font-medium mb-3 text-purple-600 dark:text-purple-400">Learning Objectives</h4>
                                    <ul className="space-y-2">
                                      {selectedRequirement.mindset_focus.learningObjectives.map((objective: string, index: number) => (
                                        <li key={index} className="flex items-start text-sm">
                                          <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                          {objective}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg">
                                    <h4 className="font-medium mb-3 text-purple-600 dark:text-purple-400">Primary Topics</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {selectedRequirement.mindset_focus.primaryTopics.map((topic: string, index: number) => (
                                        <Badge key={index} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">{topic}</Badge>
                                      ))}
                                    </div>
                                  </div>
                                  {selectedRequirement.mindset_focus.secondaryTopics.length > 0 && (
                                    <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg">
                                      <h4 className="font-medium mb-3 text-purple-600 dark:text-purple-400">Secondary Topics</h4>
                                      <div className="flex flex-wrap gap-2">
                                        {selectedRequirement.mindset_focus.secondaryTopics.map((topic: string, index: number) => (
                                          <Badge key={index} variant="outline" className="text-xs border-purple-200 text-purple-600 dark:border-purple-700 dark:text-purple-300">{topic}</Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>

                              <div className="text-xs text-muted-foreground pt-4 border-t border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 p-3 rounded-lg">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <strong className="text-gray-600 dark:text-gray-400">Created:</strong> 
                                    <p className="mt-1">{new Date(selectedRequirement.created_at).toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <strong className="text-gray-600 dark:text-gray-400">Updated:</strong> 
                                    <p className="mt-1">{new Date(selectedRequirement.updated_at).toLocaleString()}</p>
                                  </div>
                                </div>
                              </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDelete(requirement.id)}
                            disabled={deleteLoading === requirement.id}
                            className="bg-white border-gray-200 hover:bg-gray-50"
                          >
                            {deleteLoading === requirement.id ? 'Deleting...' : <Trash2 className="w-4 h-4 text-green-600" />}
                          </Button>
                        </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Training Requirement</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{requirement.training_title}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(requirement.id)}>
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
      
      <AIGeneratedAgendaDialog 
        open={aiDialogOpen}
        onOpenChange={setAiDialogOpen}
        requirement={selectedRequirement || undefined}
        availableModules={[]}
        onAgendaGenerated={(agenda) => {
          toast({
            title: 'Success',
            description: 'Training agenda generated successfully',
          });
          setAiDialogOpen(false);
        }}
      />
    </div>
  );
}