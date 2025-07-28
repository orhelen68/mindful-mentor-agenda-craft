import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Brain, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AIResponse {
  moduleID: string;
  moduleTitle: string;
  description: string;
  facilitator: string;
  participant: string;
  category: string;
  tags: string[];
  duration: number;
  deliveryMethod: {
    format: string;
    breakout: string;
  };
  groupSize: {
    min: number;
    max: number;
    optimal: number;
    'optimal breakout size': number;
  };
  mindsetTopics: string[];
  deliveryNotes: string;
  sampleMaterials: Array<{
    materialType: string;
    filename: string;
    fileFormat: string;
    fileUrl: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export function AIGeneratedModules({ onBack }: { onBack?: () => void }) {
  const [step, setStep] = useState(1);
  const [trainingTopic, setTrainingTopic] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [model, setModel] = useState('openai/gpt-4o');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiError, setAiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsedModules, setParsedModules] = useState<AIResponse[]>([]);
  const { toast } = useToast();

  const generateSystemPrompt = () => {
    const prompt = `You are an expert training facilitator and instructional designer with access to a comprehensive database of real-world training materials. Your task is to find and recommend actual, existing training modules that focus on the specified training topic.

IMPORTANT: Each training module must contain ONE SINGLE TRAINING ACTIVITY only. A training module is defined as:
- One focused activity (game, reflection, discussion, presentation, or exercise)
- Duration: 10-60 minutes
- Can be delivered to large groups, small groups, or individuals
- Self-contained with clear start and end

For each module, provide REAL examples with:
- Detailed step-by-step facilitation instructions for the ONE activity (place in "facilitator" field)
- Actual downloadable resources (presentations, handouts, worksheets)
- Specific activity setup, timing, group configurations, and materials needed
- Real-world examples and scenarios to use during the single activity

CRITICAL: You MUST return results in this EXACT structured format as a valid JSON array. DO NOT deviate from this schema:

[
  {
    "moduleID": "string",
    "moduleTitle": "string", 
    "description": "string",
    "facilitator": "string",
    "participant": "string",
    "category": "string",
    "tags": ["string"],
    "duration": number,
    "deliveryMethod": {
      "format": "presentation|exercise|discussion|game|reflection",
      "breakout": "yes|no"
    },
    "groupSize": {
      "min": number,
      "max": number, 
      "optimal": number,
      "optimal breakout size": number
    },
    "mindsetTopics": ["string"],
    "deliveryNotes": "string",
    "sampleMaterials": [
      {
        "materialType": "presentation|facilitator_guide|handout|worksheet|etc",
        "filename": "string",
        "fileFormat": "pptx|pdf|docx",
        "fileUrl": "string (real downloadable link)"
      }
    ],
    "createdAt": "ISO date",
    "updatedAt": "ISO date"
  }
]

MANDATORY REQUIREMENTS:
- Return ONLY valid JSON array format
- Include ALL fields from the schema above
- Use exact field names as specified
- Ensure proper data types (strings, numbers, arrays, objects)
- No additional text before or after the JSON

Focus on modules that are practical, tested in real training environments, and include downloadable materials from reputable training organizations, universities, or corporate learning platforms.`;
    setSystemPrompt(prompt);
  };

  const generateUserPrompt = () => {
    const prompt = `Please find real, existing training modules for the topic: "${trainingTopic}". 

CRITICAL: Each module must contain only ONE single training activity (not multiple activities).

MANDATORY DATA SCHEMA COMPLIANCE:
- You MUST return data in the EXACT JSON schema provided in the system prompt
- Include ALL required fields with correct data types
- Use proper JSON formatting with no additional text
- Return as a valid JSON array only

Requirements:
- Each module = ONE activity only (game, reflection, discussion, presentation, or exercise)
- Duration: 10-60 minutes per module
- Can be delivered to various group sizes (individual, small group, large group)
- Include detailed step-by-step facilitation instructions in the "facilitator" field
- Provide real downloadable materials (slides, handouts, worksheets)
- Focus on interactive, standalone modules with proven track records
- Include specific examples, scenarios, or case studies for the single activity
- Ensure facilitation instructions in "facilitator" field are detailed enough for a facilitator to run the one activity immediately

RESPONSE FORMAT: Return 3-5 high-quality modules as a valid JSON array following the exact schema provided. No additional text or explanations outside the JSON.`;
    setUserPrompt(prompt);
  };

  const handleStep1Submit = () => {
    if (!trainingTopic.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a training topic',
        variant: 'destructive',
      });
      return;
    }
    generateSystemPrompt();
    generateUserPrompt();
    setStep(2);
  };

  const handleAIGeneration = async () => {
    if (!apiKey.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter your OpenRouter API key',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setAiError('');
    setAiResponse('');

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: temperature,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content received from AI');
      }

      setAiResponse(content);
      
      // Try to parse JSON response
      try {
        const jsonStart = content.indexOf('[');
        const jsonEnd = content.lastIndexOf(']') + 1;
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
          const jsonContent = content.slice(jsonStart, jsonEnd);
          const parsed = JSON.parse(jsonContent);
          setParsedModules(Array.isArray(parsed) ? parsed : [parsed]);
        } else {
          setParsedModules([]);
        }
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', parseError);
        setParsedModules([]);
      }

      setStep(5);
    } catch (error) {
      console.error('AI Generation error:', error);
      setAiError(error instanceof Error ? error.message : 'Unknown error occurred');
      setStep(5);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmResponse = async () => {
    if (parsedModules.length === 0) {
      toast({
        title: 'Error',
        description: 'No valid modules to save',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Convert AI response format to our service interface format (camelCase)
      for (const module of parsedModules) {
        const trainingModule = {
          moduleID: module.moduleID || crypto.randomUUID(),
          moduleTitle: module.moduleTitle,
          description: module.description,
          facilitator: module.facilitator,
          participant: module.participant,
          category: module.category,
          tags: module.tags || [],
          duration: module.duration,
          deliveryMethod: {
            format: module.deliveryMethod.format,
            breakout: (module.deliveryMethod.breakout === 'yes' ? 'yes' : 'no') as 'yes' | 'no',
          },
          groupSize: module.groupSize,
          mindsetTopics: module.mindsetTopics || [],
          deliveryNotes: module.deliveryNotes,
          sampleMaterials: module.sampleMaterials || [],
        };

        // Use the training modules service to add the module
        const { trainingModulesService } = await import('@/services/trainingModulesService');
        await trainingModulesService.addTrainingModule(trainingModule);
      }

      toast({
        title: 'Success',
        description: `${parsedModules.length} training modules saved successfully`,
      });

      // Reset form
      setStep(1);
      setTrainingTopic('');
      setAiResponse('');
      setAiError('');
      setParsedModules([]);
    } catch (error) {
      console.error('Error saving modules:', error);
      toast({
        title: 'Error',
        description: 'Failed to save modules to database',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Generated Training Modules
          </CardTitle>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="topic">Training Topic</Label>
                <Input
                  id="topic"
                  value={trainingTopic}
                  onChange={(e) => setTrainingTopic(e.target.value)}
                  placeholder="Enter the training topic you want to generate modules for..."
                />
              </div>
              <Button onClick={handleStep1Submit}>
                Generate Prompts
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <Label className="text-base font-semibold">System Prompt</Label>
                <Textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={15}
                  className="mt-2 font-mono text-sm"
                />
              </div>
              
              <div>
                <Label className="text-base font-semibold">User Prompt</Label>
                <Textarea
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  rows={3}
                  className="mt-2"
                />
              </div>

              <div className="flex gap-4">
                <Button onClick={() => setStep(3)}>
                  Continue to API Configuration
                </Button>
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="apiKey">OpenRouter API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your OpenRouter API key"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="temperature">Temperature</Label>
                  <Input
                    id="temperature"
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="model">Model</Label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai/gpt-4o">GPT-4o</SelectItem>
                      <SelectItem value="openai/gpt-4o-mini">GPT-4o Mini</SelectItem>
                      <SelectItem value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</SelectItem>
                      <SelectItem value="meta-llama/llama-3.1-8b-instruct">Llama 3.1 8B</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-4">
                <Button onClick={handleAIGeneration} disabled={loading}>
                  <Send className="w-4 h-4 mr-2" />
                  {loading ? 'Generating...' : 'Generate AI Response'}
                </Button>
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div>
                <Label className="text-base font-semibold">System Prompt Used</Label>
                <Textarea value={systemPrompt} readOnly rows={8} className="mt-2 font-mono text-sm" />
              </div>

              <div>
                <Label className="text-base font-semibold">User Prompt Used</Label>
                <Textarea value={userPrompt} readOnly rows={2} className="mt-2" />
              </div>

              <Separator />

              {aiError && (
                <div className="p-4 border border-destructive rounded-lg bg-destructive/10">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-destructive" />
                    <Label className="text-base font-semibold text-destructive">AI Error</Label>
                  </div>
                  <div className="text-sm text-destructive">{aiError}</div>
                </div>
              )}

              {aiResponse && (
                <div>
                  <Label className="text-base font-semibold">AI Response</Label>
                  <Textarea value={aiResponse} readOnly rows={15} className="mt-2 font-mono text-sm" />
                  
                  {parsedModules.length > 0 && (
                    <div className="mt-4">
                      <Label className="text-base font-semibold">Parsed Modules ({parsedModules.length})</Label>
                      <div className="grid gap-4 mt-2">
                        {parsedModules.map((module, index) => (
                          <Card key={index} className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold">{module.moduleTitle}</h4>
                              <Badge>{module.duration} min</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{module.description}</p>
                            <div className="flex gap-2 flex-wrap">
                              {module.tags?.map((tag, tagIndex) => (
                                <Badge key={tagIndex} variant="outline">{tag}</Badge>
                              ))}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-4">
                {aiResponse && (
                  <Button 
                    onClick={handleConfirmResponse}
                    disabled={parsedModules.length === 0}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {parsedModules.length > 0 ? 'Confirm & Save Modules' : 'No Valid Modules to Save'}
                  </Button>
                )}
                <Button variant="outline" onClick={() => setStep(1)}>
                  Start Over
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}