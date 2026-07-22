import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Calendar,
  MapPin,
  Users,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Clock,
  Activity,
  TrendingUp,
  Shield,
  Music,
  Trophy,
  GraduationCap,
  Building
} from "lucide-react";

interface PredictHQEvent {
  id: string;
  title: string;
  description?: string;
  category: string;
  start: string;
  end?: string;
  location?: {
    name?: string;
    address?: string;
    coordinates?: [number, number];
  };
  rank: number;
  local_rank?: number;
  phq_attendance?: number;
  predicted_event_spend?: number;
  impact_patterns?: any;
  relevance?: number;
}

interface EventsResponse {
  count: number;
  results: PredictHQEvent[];
  metadata?: {
    location: string;
    radius_km: number;
    time_range: string;
    filters: any;
    fetched_at: string;
  };
}

interface ChennaiEventsProps {
  className?: string;
}

export function ChennaiEvents({ className = "" }: ChennaiEventsProps) {
  const [events, setEvents] = useState<PredictHQEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [serviceStatus, setServiceStatus] = useState<'configured' | 'not_configured' | 'error'>('configured');

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/events/chennai');
      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'SERVICE_NOT_CONFIGURED') {
          setServiceStatus('not_configured');
          setError('Events service is not configured. Please contact administrator.');
        } else {
          throw new Error(data.message || 'Failed to fetch events');
        }
        return;
      }

      setEvents(data.results || []);
      setLastUpdated(new Date());
      setServiceStatus('configured');
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
      setServiceStatus('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const getImpactLevel = (rank: number): 'Low' | 'Medium' | 'High' | 'Very High' => {
    if (rank >= 81) return 'Very High';
    if (rank >= 61) return 'High';
    if (rank >= 41) return 'Medium';
    return 'Low';
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'Very High': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'concerts & music':
        return <Music className="w-4 h-4" />;
      case 'sports events':
        return <Trophy className="w-4 h-4" />;
      case 'academic events':
        return <GraduationCap className="w-4 h-4" />;
      case 'conferences':
        return <Building className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const formatAttendance = (attendance?: number): string => {
    if (!attendance) return 'N/A';
    if (attendance >= 1000000) return `${(attendance / 1000000).toFixed(1)}M`;
    if (attendance >= 1000) return `${(attendance / 1000).toFixed(1)}K`;
    return attendance.toString();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);

    if (date.toDateString() === now.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-IN', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Major Events - Chennai
              </h3>
              <p className="text-sm text-muted-foreground">
                Upcoming events that may impact police operations
              </p>
            </div>
          </div>
          <Skeleton className="w-24 h-8" />
        </div>
        
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-4 w-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    );
  }

  if (error || serviceStatus !== 'configured') {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Major Events - Chennai
              </h3>
              <p className="text-sm text-muted-foreground">
                Upcoming events that may impact police operations
              </p>
            </div>
          </div>
          <Button onClick={fetchEvents} size="sm" variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {serviceStatus === 'not_configured' 
              ? 'Events service is not configured. PredictHQ API access required.'
              : error || 'Failed to load events data. Please try again.'}
          </AlertDescription>
        </Alert>

        {serviceStatus === 'not_configured' && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Configuration Required</h4>
            <p className="text-sm text-blue-700">
              To enable the events feature, please configure the PredictHQ API token in your environment settings.
              This feature provides insights into major events that may impact police resource allocation.
            </p>
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Major Events - Chennai
            </h3>
            <p className="text-sm text-muted-foreground">
              Next 7 days • High-impact events (Rank ≥60)
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Updated {lastUpdated.toLocaleTimeString('en-IN', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          )}
          <Button onClick={fetchEvents} size="sm" variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8">
          <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            No major events found for the next 7 days in Chennai.
          </p>
        </div>
      ) : (
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {events.map((event) => {
              const impactLevel = getImpactLevel(event.rank);
              
              return (
                <Card key={event.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-start gap-2 mb-2">
                        {getCategoryIcon(event.category)}
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground line-clamp-2">
                            {event.title}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {event.category}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-4">
                      <Badge className={getImpactColor(impactLevel)}>
                        {impactLevel}
                      </Badge>
                      <div className="text-xs text-muted-foreground text-right">
                        Rank: {event.rank}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">
                        {formatDate(event.start)}
                      </span>
                      <span className="text-muted-foreground">
                        {formatTime(event.start)}
                      </span>
                    </div>
                    
                    {event.location?.name && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground truncate">
                          {event.location.name}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {event.phq_attendance && (
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>~{formatAttendance(event.phq_attendance)} attendees</span>
                        </div>
                      )}
                      {event.predicted_event_spend && (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          <span>
                            ${event.predicted_event_spend >= 1000000 
                              ? `${(event.predicted_event_spend / 1000000).toFixed(1)}M` 
                              : `${(event.predicted_event_spend / 1000).toFixed(1)}K`} impact
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        <Shield className="w-3 h-3 mr-1" />
                        Police Alert
                      </Badge>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}

      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Showing {events.length} high-impact events</span>
            <span>•</span>
            <span>50km radius from Chennai</span>
          </div>
          <div className="flex items-center gap-1">
            <span>Powered by</span>
            <ExternalLink className="w-3 h-3" />
            <span>PredictHQ</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
