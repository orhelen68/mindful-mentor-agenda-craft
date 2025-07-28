import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Brain, CheckCircle, AlertCircle } from 'lucide-react';
import { TrainingRequirement } from '@/services/trainingRequirementsService';
import { TrainingModule } from '@/services/trainingModulesService';
import { TrainingAgendaFormData } from '@/services/trainingAgendasService';
import { useToast } from '@/hooks/use-toast';

interface AIGeneratedAgendaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requirement?: TrainingRequirement;
  availableModules: TrainingModule[];
  onAgendaGenerated: (agenda: Omit<TrainingAgendaFormData, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const FREE_MODELS = [
  { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B Instruct (Free)' },
  { id: 'microsoft/phi-3-mini-128k-instruct:free', name: 'Phi-3 Mini 128K (Free)' },
  { id: 'huggingface/zephyr-7b-beta:free', name: 'Zephyr 7B Beta (Free)' },
  { id: 'openchat/openchat-7b:free', name: 'OpenChat 7B (Free)' }
];

export function AIGeneratedAgendaDialog({ 
  open, 
  onOpenChange, 
  requirement, 
  availableModules,
  onAgendaGenerated 
}: AIGeneratedAgendaDialogProps) {
  const [step, setStep] = useState<'setup' | 'generating' | 'review' | 'preview'>('setup');
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [parsedAgenda, setParsedAgenda] = useState<any>(null);
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generatePrompts = () => {
    if (!requirement) return { systemPrompt: '', userPrompt: '' };

    const systemPrompt = `You are an expert training designer with 20+ years of experience creating engaging, effective training agendas. Your expertise includes:

- Adult learning principles and engagement strategies
- Optimal timing and pacing for different activity types
- Building logical learning progressions
- Balancing content delivery with interactive elements
- Creating appropriate breaks and transitions
- Designing activities that match audience experience levels

Your task is to generate comprehensive training agendas based on specific requirements. You must follow the exact JSON schema provided and create realistic, practical agendas that trainers can actually deliver.

Key Design Principles:
1. **Learning Flow**: Start with openings/introductions, build complexity gradually, include regular breaks
2. **Engagement Balance**: Mix different activity types - avoid long lecture blocks
3. **Time Management**: Realistic durations based on content complexity and group size
4. **Break Placement**: Every 60-90 minutes for longer sessions, appropriate break types
5. **Adult Learning**: Include reflection, discussion, and practical application
6. **Closure**: Always end with clear next steps and action planning

Activity Duration Guidelines:
- Formality (opening): 5-15 minutes
- Formality (intro): 10-20 minutes  
- Modules: 30-120 minutes (break longer modules into segments)
- Discussions: 15-45 minutes
- Breaks: 10-20 minutes (tea/stretch), 45-60 minutes (lunch)
- Formality (closing): 15-30 minutes

Always respond with valid JSON matching the training agenda schema exactly.`;

    const modulesText = availableModules.map(module => 
      `- ${module.moduleTitle} (${module.duration} min) - ${module.description}`
    ).join('\n');

    const userPrompt = `Create a comprehensive training agenda based on these requirements:

**Training Requirements:**
- Title: ${requirement.trainingTitle}
- Description: ${requirement.description}
- Duration: ${requirement.constraints?.duration || 480} minutes
- Group Size: ${requirement.deliveryPreferences?.groupSize || 12}
- Experience Level: ${requirement.targetAudience?.experienceLevel || 'intermediate'}
- Industry Context: ${requirement.targetAudience?.industryContext || 'General'}
- Interaction Level: ${requirement.constraints?.interactionLevel || 'medium'}

**Learning Objectives:**
${requirement.mindsetFocus?.learningObjectives?.map(obj => `- ${obj}`).join('\n') || '- To be defined'}

**Primary Topics:** ${requirement.mindsetFocus?.primaryTopics?.join(', ') || 'General training topics'}
**Secondary Topics:** ${requirement.mindsetFocus?.secondaryTopics?.join(', ') || 'Supporting topics'}

**Available Training Modules:**
${modulesText}

**Instructions:**
1. Generate a detailed training agenda that meets the exact duration requirement
2. Include appropriate mix of modules, discussions, formalities, and breaks
3. Start with opening formality and end with closing formality
4. Place breaks strategically (every 60-90 minutes)
5. Select and sequence modules logically to build toward learning objectives
6. Include pre-reading and post-workshop follow-up recommendations
7. Add facilitator notes for key transitions and considerations

**Output Requirements:**
- Return ONLY valid JSON matching the training agenda schema
- Ensure all timeslots add up to exactly ${requirement.constraints?.duration || 480} minutes
- Include realistic start times (typically 9:00 AM start)
- Add meaningful notes for complex activities
- Include 3-5 pre-reading items and 3-5 follow-up actions

The response must be valid JSON following this exact schema:
{
  "trainingID": "string",
  "trainingTitle": "string", 
  "overview": {
    "description": "string",
    "trainingObjectives": ["string"],
    "totalDuration": "number",
    "groupSize": "number"
  },
  "timeslots": [
    {
      "sequenceNumber": "number",
      "startTime": "string (HH:MM format)",
      "duration": "number",
      "activityType": "module|formality|sharing|discussion|break",
      "activityDetails": {
        "module": { "moduleID": "string", "duration": "number" },
        "formality": { "formalityType": "opening|intro|review|qa|nextsteps|closing", "duration": "number" },
        "sharing": { "speaker": "string", "topic": "string", "duration": "number" },
        "discussion": { "discussionType": "plenary|breakout", "discussionTopic": "string", "duration": "number" },
        "break": { "breakType": "tea|lunch|stretch|mingling", "duration": "number" }
      },
      "notes": "string"
    }
  ],
  "preReading": ["string"],
  "postWorkshopFollowUp": ["string"]
}`;

    setSystemPrompt(systemPrompt);
    setUserPrompt(userPrompt);
    
    return { systemPrompt, userPrompt };
  };

  const generateAgenda = async (prompts?: { systemPrompt: string; userPrompt: string }) => {
    if (!apiKey || !selectedModel) {
      toast({
        title: "Missing Information",
        description: "Please provide API key and select a model",
        variant: "destructive"
      });
      return;
    }

    // Use provided prompts or fallback to state
    const systemPromptToUse = prompts?.systemPrompt || systemPrompt;
    const userPromptToUse = prompts?.userPrompt || userPrompt;

    if (!systemPromptToUse || !userPromptToUse) {
      toast({
        title: "Missing Prompts",
        description: "System or user prompts are not available",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setStep('generating');
    setError('');

    // Update state with the prompts being used
    setSystemPrompt(systemPromptToUse);
    setUserPrompt(userPromptToUse);

    try {
      const modelToUse = selectedModel === 'custom' ? customModel : selectedModel;
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-Title': 'Training Agenda Generator'
        },
        body: JSON.stringify({
          model: modelToUse,
          messages: [
            { role: 'system', content: systemPromptToUse },
            { role: 'user', content: userPromptToUse }
          ],
          temperature: 0.7,
          max_tokens: 4000
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `API Error: ${response.status}`);
      }

      const data = await response.json();
      const generatedContent = data.choices[0]?.message?.content;
      
      if (!generatedContent) {
        throw new Error('No content generated');
      }

      setAiResponse(generatedContent);
      setStep('review');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const confirmAgenda = () => {
    try {
      console.log('Raw AI Response:', aiResponse);
      
      // Clean the response - remove markdown code blocks if present
      let cleanedResponse = aiResponse.trim();
      
      // Remove markdown code blocks
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      console.log('Cleaned Response:', cleanedResponse);
      
      // Parse and validate the JSON response
      const agendaData = JSON.parse(cleanedResponse);
      console.log('Parsed Agenda Data:', agendaData);
      
      // Convert to our internal format
      const agenda: Omit<TrainingAgendaFormData, 'id' | 'createdAt' | 'updatedAt'> = {
        trainingID: requirement?.trainingID || agendaData.trainingID,
        trainingTitle: agendaData.trainingTitle,
        overview: agendaData.overview,
        timeslots: agendaData.timeslots,
        preReading: agendaData.preReading || [],
        postWorkshopFollowUp: agendaData.postWorkshopFollowUp || [],
        facilitatorNotes: 'Generated by AI',
        materialsList: []
      };

      console.log('Final Agenda Object:', agenda);
      setParsedAgenda(agenda);
      setStep('preview');
    } catch (err) {
      console.error('JSON Parsing Error:', err);
      console.error('Failed Response:', aiResponse);
      toast({
        title: "Invalid Response",
        description: `The AI response is not valid JSON: ${err instanceof Error ? err.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  const finalizeAgenda = () => {
    if (parsedAgenda) {
      onAgendaGenerated(parsedAgenda);
      onOpenChange(false);
      resetDialog();
      
      toast({
        title: "Agenda Generated",
        description: "AI-generated training agenda has been created successfully",
      });
    }
  };

  const resetDialog = () => {
    setStep('setup');
    setApiKey('');
    setSelectedModel('');
    setCustomModel('');
    setSystemPrompt('');
    setUserPrompt('');
    setAiResponse('');
    setError('');
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetDialog();
    }
    onOpenChange(open);
  };

  if (!requirement) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Generate Training Agenda
          </DialogTitle>
        </DialogHeader>

        {step === 'setup' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="api-key">OpenRouter API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your OpenRouter API key"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Get your API key from <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">OpenRouter.ai</a>
                </p>
              </div>

              <div>
                <Label htmlFor="model">AI Model</Label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an AI model" />
                  </SelectTrigger>
                  <SelectContent>
                    {FREE_MODELS.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex items-center gap-2">
                          {model.name}
                          <Badge variant="secondary" className="text-xs">Free</Badge>
                        </div>
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Custom Model</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedModel === 'custom' && (
                <div>
                  <Label htmlFor="custom-model">Custom Model Name</Label>
                  <Input
                    id="custom-model"
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    placeholder="e.g., gpt-4, claude-3-sonnet"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={async () => {
                  const prompts = generatePrompts();
                  await generateAgenda(prompts);
                }}
                disabled={!apiKey || !selectedModel || (selectedModel === 'custom' && !customModel) || isGenerating}
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Generate Training Agenda
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {step === 'generating' && (
          <div className="space-y-6">
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Generating Training Agenda</h3>
              <p className="text-muted-foreground">AI is creating your personalized training agenda...</p>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">System Prompt</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea 
                    value={systemPrompt} 
                    readOnly 
                    className="min-h-[100px] text-xs"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">User Prompt</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea 
                    value={userPrompt} 
                    readOnly 
                    className="min-h-[150px] text-xs"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              {error ? (
                <AlertCircle className="h-5 w-5 text-red-500" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              <h3 className="text-lg font-semibold">
                {error ? 'Generation Failed' : 'Review AI Response'}
              </h3>
            </div>

            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-red-700">Error</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-red-600">{error}</p>
                </CardContent>
              </Card>
            )}

            {aiResponse && !error && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">AI Generated Agenda</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea 
                    value={aiResponse} 
                    readOnly 
                    className="min-h-[300px] text-xs font-mono"
                  />
                </CardContent>
              </Card>
            )}

            <div className="flex gap-3">
              {aiResponse && !error && (
                <Button onClick={confirmAgenda} className="flex-1">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm & Create Agenda
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => setStep('setup')}
              >
                Back to Setup
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {step === 'preview' && parsedAgenda && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <h3 className="text-lg font-semibold">Preview Training Agenda</h3>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{parsedAgenda.trainingTitle}</CardTitle>
                  <p className="text-muted-foreground">{parsedAgenda.overview?.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Duration:</strong> {parsedAgenda.overview?.totalDuration} minutes
                    </div>
                    <div>
                      <strong>Group Size:</strong> {parsedAgenda.overview?.groupSize}
                    </div>
                  </div>
                  
                  {parsedAgenda.overview?.trainingObjectives && (
                    <div className="mt-4">
                      <strong className="text-sm">Learning Objectives:</strong>
                      <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                        {parsedAgenda.overview.trainingObjectives.map((objective: string, index: number) => (
                          <li key={index}>{objective}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Agenda Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {parsedAgenda.timeslots?.map((timeslot: any, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className="flex-shrink-0 text-sm font-mono bg-muted px-2 py-1 rounded">
                          {timeslot.startTime}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {timeslot.activityType}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {timeslot.duration}min
                            </span>
                          </div>
                          {timeslot.activityType === 'module' && timeslot.activityDetails?.module && (
                            <div className="text-sm">
                              <strong>Module:</strong> {timeslot.activityDetails.module.moduleID}
                            </div>
                          )}
                          {timeslot.activityType === 'formality' && timeslot.activityDetails?.formality && (
                            <div className="text-sm">
                              <strong>Formality:</strong> {timeslot.activityDetails.formality.formalityType}
                            </div>
                          )}
                          {timeslot.activityType === 'discussion' && timeslot.activityDetails?.discussion && (
                            <div className="text-sm">
                              <strong>Discussion:</strong> {timeslot.activityDetails.discussion.discussionTopic}
                              <br />
                              <span className="text-muted-foreground">Type: {timeslot.activityDetails.discussion.discussionType}</span>
                            </div>
                          )}
                          {timeslot.activityType === 'break' && timeslot.activityDetails?.break && (
                            <div className="text-sm">
                              <strong>Break:</strong> {timeslot.activityDetails.break.breakType}
                            </div>
                          )}
                          {timeslot.notes && (
                            <p className="text-xs text-muted-foreground mt-1">{timeslot.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {(parsedAgenda.preReading?.length > 0 || parsedAgenda.postWorkshopFollowUp?.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {parsedAgenda.preReading?.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Pre-Reading</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {parsedAgenda.preReading.map((item: string, index: number) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                  
                  {parsedAgenda.postWorkshopFollowUp?.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Follow-up Actions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {parsedAgenda.postWorkshopFollowUp.map((item: string, index: number) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button onClick={finalizeAgenda} className="flex-1">
                <CheckCircle className="h-4 w-4 mr-2" />
                Create This Agenda
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setStep('review')}
              >
                Back to Review
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}