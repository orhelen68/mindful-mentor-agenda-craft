import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trainingAgendasService, TrainingAgenda } from '@/services/trainingAgendasService';
import { trainingModulesService, TrainingModule } from '@/services/trainingModulesService';
import { AgendaBuilder } from '@/components/AgendaBuilder';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EditAgenda() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [agenda, setAgenda] = useState<TrainingAgenda | null>(null);
  const [availableModules, setAvailableModules] = useState<TrainingModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        setError('No agenda ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [agendaData, modulesData] = await Promise.all([
          trainingAgendasService.getTrainingAgendaById(id),
          trainingModulesService.getTrainingModules()
        ]);

        if (!agendaData) {
          setError('Agenda not found');
        } else {
          setAgenda(agendaData);
        }
        setAvailableModules(modulesData);
      } catch (err) {
        console.error('Error loading agenda:', err);
        setError('Failed to load agenda');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleSaveAgenda = async (updatedAgenda: any) => {
    if (!id) return;

    try {
      await trainingAgendasService.updateTrainingAgenda(id, updatedAgenda);
      toast({
        title: 'Success',
        description: 'Training agenda updated successfully!',
      });
      navigate('/');
    } catch (error) {
      console.error('Error updating agenda:', error);
      toast({
        title: 'Error',
        description: 'Failed to update training agenda.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-950 dark:to-indigo-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Loading agenda...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-950 dark:to-indigo-950 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate('/')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!agenda) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-950 dark:to-indigo-950 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Agenda Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">The requested agenda could not be found.</p>
            <Button onClick={() => navigate('/')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-950 dark:to-indigo-950 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Button onClick={() => navigate('/')} variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Edit Training Agenda
            </h1>
            <p className="text-muted-foreground">{agenda.trainingTitle}</p>
          </div>
        </div>

        <AgendaBuilder
          requirement={{
            id: agenda.trainingID,
            trainingID: agenda.trainingID,
            trainingTitle: agenda.trainingTitle,
            description: '',
            targetAudience: { experienceLevel: 'intermediate', industryContext: '' },
            constraints: { duration: agenda.overview.totalDuration, interactionLevel: 'medium' },
            mindsetFocus: { learningObjectives: [], primaryTopics: [], secondaryTopics: [] },
            deliveryPreferences: { format: 'in-person', groupSize: agenda.overview.groupSize },
            userID: agenda.userID || '',
            createdAt: agenda.createdAt,
            updatedAt: agenda.updatedAt,
          }}
          availableModules={availableModules}
          matchedModules={availableModules}
          onSave={handleSaveAgenda}
          initialAgenda={agenda}
        />
      </div>
    </div>
  );
}