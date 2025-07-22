import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrainingRequirementsForm } from '@/components/TrainingRequirementsForm';
import { TrainingRequirementsManagement } from '@/components/TrainingRequirementsManagement';
import { TrainingModulesManagement } from '@/components/TrainingModulesManagement';
import { Auth } from '@/components/Auth';
import { useAuth } from '@/hooks/useAuth';
import { BookOpen, Settings, FileText, LogOut, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const { user, loading, signOut, userRole } = useAuth();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'requirements-form');

  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="text-center flex-1">
                <CardTitle className="text-3xl font-bold mb-2">Training Management System</CardTitle>
                <p className="text-muted-foreground">
                  Create training requirements and manage your training modules
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <div className="text-sm">
                    <div className="font-medium">{user.email}</div>
                    {userRole && (
                      <Badge variant="secondary" className="text-xs">
                        {userRole}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSignOut}
                  className="flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </div>
            </div>
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
