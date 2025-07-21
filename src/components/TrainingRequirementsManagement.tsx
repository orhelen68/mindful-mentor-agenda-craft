import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Trash2, Eye, Clock, Users } from 'lucide-react';
import { jsonBinService, TrainingRequirement } from '@/services/jsonbin';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export function TrainingRequirementsManagement() {
  const [requirements, setRequirements] = useState<TrainingRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequirement, setSelectedRequirement] = useState<TrainingRequirement | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const loadRequirements = async () => {
    try {
      const data = await jsonBinService.getTrainingRequirements();
      setRequirements(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load training requirements',
        variant: 'destructive',
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
      await jsonBinService.deleteTrainingRequirement(id);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading training requirements...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Training Requirements Management</h2>
        <Button onClick={loadRequirements} variant="outline">
          Refresh
        </Button>
      </div>

      {requirements.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No Training Requirements Found</h3>
              <p className="text-muted-foreground">Create your first training requirement to get started.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requirements.map((requirement) => (
            <Card key={requirement.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{requirement.trainingTitle}</CardTitle>
                    <div className="flex gap-2 mb-2">
                      <Badge variant="secondary">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDuration(requirement.constraints.duration)}
                      </Badge>
                      <Badge variant="outline">
                        <Users className="w-3 h-3 mr-1" />
                        {requirement.deliveryPreferences.groupSize} people
                      </Badge>
                      <Badge variant="outline">
                        {requirement.constraints.interactionLevel} interaction
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {requirement.targetAudience.industryContext}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRequirement(requirement)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Training Requirement Details</DialogTitle>
                        </DialogHeader>
                        {selectedRequirement && (
                          <div className="space-y-6">
                            <div>
                              <h3 className="font-semibold mb-2">Training Information</h3>
                              <p className="text-sm mb-1"><strong>ID:</strong> {selectedRequirement.trainingID}</p>
                              <p className="text-sm mb-1"><strong>Title:</strong> {selectedRequirement.trainingTitle}</p>
                              <p className="text-sm mb-3"><strong>Description:</strong> {selectedRequirement.description}</p>
                            </div>

                            <div>
                              <h3 className="font-semibold mb-2">Learning Objectives</h3>
                              <ul className="list-disc list-inside space-y-1">
                                {selectedRequirement.mindsetFocus.learningObjectives.map((objective, index) => (
                                  <li key={index} className="text-sm">{objective}</li>
                                ))}
                              </ul>
                            </div>

                            <div className="mb-3">
                              <h4 className="font-medium mb-1">Primary Topics:</h4>
                              <ul className="list-disc list-inside space-y-1">
                                {selectedRequirement.mindsetFocus.primaryTopics.map((topic, index) => (
                                  <li key={index} className="text-sm">{topic}</li>
                                ))}
                              </ul>
                            </div>
                            {selectedRequirement.mindsetFocus.secondaryTopics.length > 0 && (
                              <div className="mb-3">
                                <h4 className="font-medium mb-1">Secondary Topics:</h4>
                                <ul className="list-disc list-inside space-y-1">
                                  {selectedRequirement.mindsetFocus.secondaryTopics.map((topic, index) => (
                                    <li key={index} className="text-sm">{topic}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            <div className="mb-3">
                              <p className="text-sm mb-1"><strong>Duration:</strong> {formatDuration(selectedRequirement.constraints.duration)}</p>
                              <p className="text-sm"><strong>Interaction Level:</strong> {selectedRequirement.constraints.interactionLevel}</p>
                            </div>

                            <div className="mb-3">
                              <p className="text-sm mb-1"><strong>Experience Level:</strong> {selectedRequirement.targetAudience.experienceLevel}</p>
                              <p className="text-sm mb-1"><strong>Industry Context:</strong> {selectedRequirement.targetAudience.industryContext}</p>
                            </div>

                            <div className="mb-3">
                              <p className="text-sm mb-1"><strong>Format:</strong> {selectedRequirement.deliveryPreferences.format}</p>
                              <p className="text-sm"><strong>Group Size:</strong> {selectedRequirement.deliveryPreferences.groupSize}</p>
                            </div>

                            <div className="text-xs text-muted-foreground">
                              <p><strong>Created:</strong> {new Date(selectedRequirement.createdAt).toLocaleString()}</p>
                              <p><strong>Updated:</strong> {new Date(selectedRequirement.updatedAt).toLocaleString()}</p>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deleteLoading === requirement.id}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          {deleteLoading === requirement.id ? 'Deleting...' : 'Delete'}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Training Requirement</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this training requirement? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(requirement.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}