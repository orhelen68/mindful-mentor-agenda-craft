import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar,
  Clock,
  User,
  MessageSquare,
  Coffee,
  BookOpen,
  FileText,
  Bookmark,
  Target
} from 'lucide-react';

interface Timeslot {
  sequenceNumber: number;
  startTime: string;
  duration: number;
  activityType: 'module' | 'formality' | 'speaker' | 'discussion' | 'break';
  activityDetails: any;
  notes?: string;
}

interface AgendaPreviewProps {
  title: string;
  description: string;
  timeslots: Timeslot[];
  facilitatorNotes?: string;
  materialsNeeded?: string[];
  preReading?: string[];
  postFollowUp?: string[];
}

export function AgendaPreview({
  title,
  description,
  timeslots,
  facilitatorNotes,
  materialsNeeded = [],
  preReading = [],
  postFollowUp = []
}: AgendaPreviewProps) {
  const totalDuration = timeslots.reduce((total, slot) => total + slot.duration, 0);
  const hours = Math.floor(totalDuration / 60);
  const minutes = totalDuration % 60;

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'module': return <BookOpen className="h-4 w-4 text-blue-600" />;
      case 'formality': return <Clock className="h-4 w-4 text-gray-600" />;
      case 'speaker': return <User className="h-4 w-4 text-green-600" />;
      case 'discussion': return <MessageSquare className="h-4 w-4 text-purple-600" />;
      case 'break': return <Coffee className="h-4 w-4 text-orange-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityTitle = (timeslot: Timeslot) => {
    const details = timeslot.activityDetails;
    switch (timeslot.activityType) {
      case 'module':
        return details.module?.moduleTitle || 'Module Activity';
      case 'formality':
        return details.formality?.formalityType || 'Formality';
      case 'speaker':
        return details.speaker?.topic || 'Speaker Session';
      case 'discussion':
        return details.discussion?.discussionTopic || 'Discussion';
      case 'break':
        return `${details.break?.breakType || ''} Break`.trim();
      default:
        return 'Activity';
    }
  };

  const getActivitySubtitle = (timeslot: Timeslot) => {
    const details = timeslot.activityDetails;
    switch (timeslot.activityType) {
      case 'module':
        return details.module?.facilitator ? `Facilitator: ${details.module.facilitator}` : '';
      case 'formality':
        return details.formality?.description || '';
      case 'speaker':
        return details.speaker?.speakerName ? `Speaker: ${details.speaker.speakerName}` : '';
      case 'discussion':
        return details.discussion?.discussionType ? `Format: ${details.discussion.discussionType}` : '';
      case 'break':
        return details.break?.location ? `Location: ${details.break.location}` : '';
      default:
        return '';
    }
  };

  const formatTime = (timeString: string, duration: number) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const startTime = new Date();
    startTime.setHours(hours, minutes, 0, 0);
    
    const endTime = new Date(startTime.getTime() + duration * 60000);
    
    const formatTimeStr = (date: Date) => 
      date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      });
    
    return `${formatTimeStr(startTime)} - ${formatTimeStr(endTime)}`;
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6 text-primary" />
            <div>
              <CardTitle className="text-2xl">{title}</CardTitle>
              <p className="text-muted-foreground mt-1">{description}</p>
            </div>
          </div>
          <div className="flex items-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>
                Total Duration: {hours > 0 && `${hours}h `}{minutes > 0 && `${minutes}m`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span>{timeslots.length} Activities</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Training Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {timeslots.map((timeslot, index) => (
            <div key={timeslot.sequenceNumber}>
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background border-2 border-primary">
                    {getActivityIcon(timeslot.activityType)}
                  </div>
                  {index < timeslots.length - 1 && (
                    <div className="w-px h-12 bg-border mt-2" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-lg">{getActivityTitle(timeslot)}</h4>
                      {getActivitySubtitle(timeslot) && (
                        <p className="text-sm text-muted-foreground">
                          {getActivitySubtitle(timeslot)}
                        </p>
                      )}
                      {timeslot.notes && (
                        <p className="text-sm text-muted-foreground mt-1 italic">
                          {timeslot.notes}
                        </p>
                      )}
                    </div>
                    
                    <div className="text-right text-sm shrink-0">
                      <div className="font-mono">
                        {formatTime(timeslot.startTime, timeslot.duration)}
                      </div>
                      <Badge variant="outline" className="mt-1 capitalize">
                        {timeslot.activityType}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {timeslots.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No activities scheduled yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pre-Reading */}
        {preReading.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="h-5 w-5" />
                Pre-Reading Materials
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {preReading.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 shrink-0" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Post-Workshop Follow-up */}
        {postFollowUp.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bookmark className="h-5 w-5" />
                Post-Workshop Follow-up
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {postFollowUp.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 shrink-0" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Materials Needed */}
        {materialsNeeded.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Materials Needed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {materialsNeeded.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 shrink-0" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Facilitator Notes */}
        {facilitatorNotes && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                Facilitator Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{facilitatorNotes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}