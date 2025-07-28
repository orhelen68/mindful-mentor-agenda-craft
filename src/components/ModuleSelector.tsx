import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrainingModule } from '@/services/trainingModulesService';
import { Search, Filter, Star, Plus, Clock, Users } from 'lucide-react';

interface ModuleSelectorProps {
  availableModules: TrainingModule[];
  matchedModules: TrainingModule[];
  onSelectModule: (module: TrainingModule) => void;
}

export function ModuleSelector({ 
  availableModules, 
  matchedModules, 
  onSelectModule 
}: ModuleSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showMatched, setShowMatched] = useState(true);

  // Get unique categories
  const categories = Array.from(
    new Set(availableModules.map(module => module.category).filter(Boolean))
  );

  const filteredModules = availableModules.filter(module => {
    const matchesSearch = module.moduleTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (module.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (module.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' || module.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const displayModules = showMatched ? 
    filteredModules.filter(module => 
      matchedModules.some(matched => matched.moduleID === module.moduleID)
    ) : 
    filteredModules;

  const ModuleCard = ({ module, isMatched }: { module: TrainingModule; isMatched: boolean }) => (
    <Card className={`h-full transition-shadow hover:shadow-md ${isMatched ? 'ring-2 ring-primary/20' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg leading-tight line-clamp-2">
              {module.moduleTitle}
              {isMatched && (
                <Star className="inline h-4 w-4 ml-2 text-yellow-500 fill-current" />
              )}
            </CardTitle>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {module.duration || 'N/A'} min
              </div>
              {module.groupSize?.optimal && (
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {module.groupSize.optimal} people
                </div>
              )}
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => onSelectModule(module)}
            className="shrink-0"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
          {module.description || 'No description available'}
        </p>
        
        <div className="space-y-2">
          {module.category && (
            <Badge variant="secondary" className="text-xs">
              {module.category}
            </Badge>
          )}
          
          {module.tags && module.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {module.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {module.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{module.tags.length - 3} more
                </Badge>
              )}
            </div>
          )}

          {module.mindsetTopics && module.mindsetTopics.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {module.mindsetTopics.slice(0, 2).map((topic, index) => (
                <Badge key={index} variant="default" className="text-xs">
                  {topic}
                </Badge>
              ))}
              {module.mindsetTopics.length > 2 && (
                <Badge variant="default" className="text-xs">
                  +{module.mindsetTopics.length - 2} more
                </Badge>
              )}
            </div>
          )}
        </div>

        {module.facilitator && (
          <div className="mt-3 text-xs text-muted-foreground">
            Facilitator: {module.facilitator}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Training Module Library
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search modules by title, description, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category || ''}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={showMatched ? "default" : "outline"}
              size="sm"
              onClick={() => setShowMatched(true)}
              className="flex items-center gap-2"
            >
              <Star className="h-4 w-4" />
              Recommended ({matchedModules.length})
            </Button>
            <Button
              variant={!showMatched ? "default" : "outline"}
              size="sm"
              onClick={() => setShowMatched(false)}
            >
              All Modules ({filteredModules.length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Module Grid */}
      {displayModules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayModules.map((module) => {
            const isMatched = matchedModules.some(matched => matched.moduleID === module.moduleID);
            return (
              <ModuleCard
                key={module.moduleID}
                module={module}
                isMatched={isMatched}
              />
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No modules found</h3>
              <p className="text-muted-foreground">
                {searchTerm || categoryFilter !== 'all' 
                  ? 'Try adjusting your search criteria or filters'
                  : 'No modules available in the library'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Text for Matched Modules */}
      {showMatched && matchedModules.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Star className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">
                  Recommended Modules
                </h4>
                <p className="text-sm text-blue-700">
                  These modules are recommended based on your training requirements' mindset topics and learning objectives. 
                  They have been ranked by relevance to help you build an effective agenda.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}