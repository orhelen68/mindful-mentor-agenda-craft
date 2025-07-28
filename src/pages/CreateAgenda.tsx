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
    const mindsetTopics = req.mindsetFocus?.primaryTopics || [];
    const secondaryTopics = req.mindsetFocus?.secondaryTopics || [];
    const allRequiredTopics = [...mindsetTopics, ...secondaryTopics];

    return availableModules
      .map(module => {
        let score = 0;
        const moduleTags = module.tags || [];
        const mindsetModuleTopics = module.mindsetTopics || [];

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
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-2xl p-6 border border-green-100 dark:border-green-800">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center gap-2 bg-white/50 border-green-200 hover:bg-green-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Create Training Agenda
              </h1>
              <p className="text-muted-foreground mt-1">
                Build your training agenda based on requirements and available modules
              </p>
            </div>
          </div>
        </div>

        {/* Training Requirements Summary */}
        <Card className="shadow-xl bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 border-gray-200 dark:border-gray-700">
          <CardHeader className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-t-lg">
            <CardTitle className="flex items-center gap-2 bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
              <BookOpen className="h-5 w-5 text-blue-600" />
              {requirement.trainingTitle}
            </CardTitle>
            <CardDescription>{requirement.description}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center gap-2 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 p-3 rounded-lg border border-orange-100 dark:border-orange-800">
                <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <span className="text-sm text-orange-700 dark:text-orange-300">
                  Duration: {requirement.constraints?.duration || 'Not specified'} minutes
                </span>
              </div>
              <div className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 p-3 rounded-lg border border-purple-100 dark:border-purple-800">
                <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm text-purple-700 dark:text-purple-300">
                  Experience: {requirement.targetAudience?.experienceLevel || 'Not specified'}
                </span>
              </div>
              <div className="flex items-center justify-center bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20 p-3 rounded-lg border border-teal-100 dark:border-teal-800">
                <Badge className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white">
                  {requirement.deliveryPreferences?.format || 'Any format'}
                </Badge>
              </div>
            </div>
            
            {requirement.mindsetFocus?.primaryTopics && (
              <div className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-950/20 dark:to-gray-950/20 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                <p className="text-sm font-medium mb-3 text-slate-700 dark:text-slate-300">Primary Topics:</p>
                <div className="flex flex-wrap gap-2">
                  {requirement.mindsetFocus.primaryTopics.map((topic, index) => (
                    <Badge key={index} className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
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