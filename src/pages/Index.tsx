import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrainingRequirementsForm } from '@/components/TrainingRequirementsForm';
import { TrainingRequirementsManagement } from '@/components/TrainingRequirementsManagement';
import { TrainingModulesManagement } from '@/components/TrainingModulesManagement';
import { BookOpen, Settings, FileText } from 'lucide-react';

const Index = () => {
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'requirements-form');

  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <Card className="mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold mb-2">Training Management System</CardTitle>
            <p className="text-muted-foreground">
              Create training requirements and manage your training modules
            </p>
          </CardHeader>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="requirements-management" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Propose Training Agenda
            </TabsTrigger>
            <TabsTrigger value="modules-management" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Training Module Library
            </TabsTrigger>
            <TabsTrigger value="add-requirements" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Add Training Requirements
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requirements-management" className="mt-6">
            <TrainingRequirementsManagement />
          </TabsContent>

          <TabsContent value="modules-management" className="mt-6">
            <TrainingModulesManagement />
          </TabsContent>

          <TabsContent value="add-requirements" className="mt-6">
            <TrainingRequirementsForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
