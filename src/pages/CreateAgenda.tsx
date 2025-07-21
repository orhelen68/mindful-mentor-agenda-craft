import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { trainingRequirementsService, TrainingRequirement } from '@/services/trainingRequirementsService';
import { trainingModulesService, TrainingModule } from '@/services/trainingModulesService';
import { trainingAgendasService, TrainingAgendaFormData } from '@/services/trainingAgendasService';
import { AgendaBuilder } from '@/components/AgendaBuilder';
import { ArrowLeft, BookOpen, Clock, Users } from 'lucide-react';

export default function CreateAgenda() {
  const { requirementsId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [requirement, setRequirement] = useState<TrainingRequirement | null>(null);
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [matchedModules, setMatchedModules] = useState<TrainingModule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [requirementsId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load training requirements and modules
      const [requirementsData, modulesData] = await Promise.all([
        trainingRequirementsService.getTrainingRequirements(),
        trainingModulesService.getTrainingModules()
      ]);

      let selectedRequirement: TrainingRequirement | null = null;
      
      if (requirementsId) {
        selectedRequirement = requirementsData.find(req => req.id === requirementsId) || null;
      } else {
        // If no specific ID, use the most recent requirement
        selectedRequirement = requirementsData[0] || null;
      }

      if (!selectedRequirement) {
        toast({
          title: "Error",
          description: "Training requirements not found",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      setRequirement(selectedRequirement);
      setModules(modulesData);

      // Smart module matching based on mindset topics and tags
      const matched = smartModuleMatching(selectedRequirement, modulesData);
      setMatchedModules(matched);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load training data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const smartModuleMatching = (req: TrainingRequirement, availableModules: TrainingModule[]): TrainingModule[] => {
    const mindsetTopics = req.mindset_focus?.primaryTopics || [];
    const secondaryTopics = req.mindset_focus?.secondaryTopics || [];
    const allRequiredTopics = [...mindsetTopics, ...secondaryTopics];

    return availableModules
      .map(module => {
        let score = 0;
        const moduleTags = module.tags || [];
        const mindsetModuleTopics = module.mindset_topics || [];

        // Score based on mindset topics match
        mindsetModuleTopics.forEach(topic => {
          if (allRequiredTopics.some(reqTopic => 
            reqTopic.toLowerCase().includes(topic.toLowerCase()) || 
            topic.toLowerCase().includes(reqTopic.toLowerCase())
          )) {
            score += 10;
          }
        });

        // Score based on tags match
        moduleTags.forEach(tag => {
          if (allRequiredTopics.some(reqTopic => 
            reqTopic.toLowerCase().includes(tag.toLowerCase()) || 
            tag.toLowerCase().includes(reqTopic.toLowerCase())
          )) {
            score += 5;
          }
        });

        return { ...module, matchScore: score };
      })
      .filter(module => module.matchScore > 0)
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  };

  const handleSaveAgenda = async (agendaData: Omit<TrainingAgendaFormData, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await trainingAgendasService.addTrainingAgenda(agendaData);
      toast({
        title: "Success",
        description: "Training agenda saved successfully",
      });
      navigate('/');
    } catch (error) {
      console.error('Error saving agenda:', error);
      toast({
        title: "Error",
        description: "Failed to save training agenda",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading training data...</p>
        </div>
      </div>
    );
  }

  if (!requirement) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">No training requirements found</p>
            <Button onClick={() => navigate('/')}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create Training Agenda</h1>
            <p className="text-muted-foreground">
              Build your training agenda based on requirements and available modules
            </p>
          </div>
        </div>

        {/* Training Requirements Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {requirement.training_title}
            </CardTitle>
            <CardDescription>{requirement.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Duration: {requirement.constraints?.duration || 'Not specified'} minutes
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Experience: {requirement.target_audience?.experienceLevel || 'Not specified'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {requirement.delivery_preferences?.format || 'Any format'}
                </Badge>
              </div>
            </div>
            
            {requirement.mindset_focus?.primaryTopics && (
              <div>
                <p className="text-sm font-medium mb-2">Primary Topics:</p>
                <div className="flex flex-wrap gap-2">
                  {requirement.mindset_focus.primaryTopics.map((topic, index) => (
                    <Badge key={index} variant="default">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Agenda Builder */}
        <AgendaBuilder
          requirement={requirement}
          availableModules={modules}
          matchedModules={matchedModules}
          onSave={handleSaveAgenda}
        />
      </div>
    </div>
  );
}