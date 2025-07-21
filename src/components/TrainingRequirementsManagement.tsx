import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Trash2, Eye, FileText, Clock, Users, Target } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trainingRequirementsService, TrainingRequirement } from '@/services/trainingRequirementsService';
import { useToast } from '@/hooks/use-toast';

export function TrainingRequirementsManagement() {
  const [requirements, setRequirements] = useState<TrainingRequirement[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<TrainingRequirement | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const { toast } = useToast();

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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Training Requirements Management</h2>
        <Button onClick={loadRequirements} variant="outline">
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading training requirements...</div>
        </div>
      ) : requirements.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No Training Requirements Found</h3>
              <p className="text-muted-foreground">
                Create your first training requirement using the form to get started.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requirements.map((requirement) => (
            <Card key={requirement.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">{requirement.training_title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">ID: {requirement.training_id}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Badge variant="secondary" className="mb-2">
                      {requirement.target_audience.experienceLevel}
                    </Badge>
                    <Badge variant="outline">
                      {requirement.delivery_preferences.format}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-3">{requirement.description}</p>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground mb-2">
                      <Clock className="w-4 h-4 mr-2" />
                      {formatDuration(requirement.constraints.duration)}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="w-4 h-4 mr-2" />
                      {requirement.delivery_preferences.groupSize} participants
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedRequirement(requirement)}>
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{selectedRequirement?.training_title}</DialogTitle>
                        </DialogHeader>
                        {selectedRequirement && (
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <h3 className="font-semibold mb-2 flex items-center">
                                  <FileText className="w-4 h-4 mr-2" />
                                  Basic Information
                                </h3>
                                <div className="space-y-2 text-sm">
                                  <p><strong>ID:</strong> {selectedRequirement.training_id}</p>
                                  <p><strong>Description:</strong> {selectedRequirement.description}</p>
                                  <p><strong>Industry:</strong> {selectedRequirement.target_audience.industryContext}</p>
                                  <p><strong>Experience Level:</strong> {selectedRequirement.target_audience.experienceLevel}</p>
                                </div>
                              </div>
                              <div>
                                <h3 className="font-semibold mb-2 flex items-center">
                                  <Clock className="w-4 h-4 mr-2" />
                                  Constraints & Delivery
                                </h3>
                                <div className="space-y-2 text-sm">
                                  <p><strong>Duration:</strong> {formatDuration(selectedRequirement.constraints.duration)}</p>
                                  <p><strong>Interaction Level:</strong> {selectedRequirement.constraints.interactionLevel}</p>
                                  <p><strong>Format:</strong> {selectedRequirement.delivery_preferences.format}</p>
                                  <p><strong>Group Size:</strong> {selectedRequirement.delivery_preferences.groupSize} participants</p>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h3 className="font-semibold mb-3 flex items-center">
                                <Target className="w-4 h-4 mr-2" />
                                Learning Objectives & Topics
                              </h3>
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-medium mb-2">Learning Objectives</h4>
                                  <ul className="list-disc list-inside space-y-1">
                                    {selectedRequirement.mindset_focus.learningObjectives.map((objective: string, index: number) => (
                                      <li key={index} className="text-sm">{objective}</li>
                                    ))}
                                  </ul>
                                </div>
                                <div>
                                  <h4 className="font-medium mb-2">Primary Topics</h4>
                                  <div className="flex flex-wrap gap-1">
                                    {selectedRequirement.mindset_focus.primaryTopics.map((topic: string, index: number) => (
                                      <Badge key={index} variant="default" className="text-xs">{topic}</Badge>
                                    ))}
                                  </div>
                                </div>
                                {selectedRequirement.mindset_focus.secondaryTopics.length > 0 && (
                                  <div>
                                    <h4 className="font-medium mb-2">Secondary Topics</h4>
                                    <div className="flex flex-wrap gap-1">
                                      {selectedRequirement.mindset_focus.secondaryTopics.map((topic: string, index: number) => (
                                        <Badge key={index} variant="outline" className="text-xs">{topic}</Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="text-xs text-muted-foreground pt-4 border-t">
                              <p><strong>Created:</strong> {new Date(selectedRequirement.created_at).toLocaleString()}</p>
                              <p><strong>Updated:</strong> {new Date(selectedRequirement.updated_at).toLocaleString()}</p>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDelete(requirement.id)}
                          disabled={deleteLoading === requirement.id}
                        >
                          {deleteLoading === requirement.id ? 'Deleting...' : <Trash2 className="w-4 h-4" />}
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
    </div>
  );
}