import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Radio, 
  AlertCircle, 
  Clock, 
  MapPin, 
  TrendingUp, 
  Pause, 
  Play,
  Volume2,
  VolumeX 
} from "lucide-react";
import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";

interface CrimeIncidentLive {
  id: string;
  type: string;
  location: string;
  district: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  description: string;
  status: 'reported' | 'investigating' | 'resolved';
  unitAssigned?: string;
  responseTime?: number;
}

interface RealTimeCrimeFeedProps {
  className?: string;
  maxItems?: number;
  autoRefresh?: boolean;
}

export function RealTimeCrimeFeed({ 
  className = "",
  maxItems = 10,
  autoRefresh = true 
}: RealTimeCrimeFeedProps) {
  const [incidents, setIncidents] = useState<CrimeIncidentLive[]>([]);
  const [isLive, setIsLive] = useState(autoRefresh);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Mock data generator for demonstration
  const generateMockIncident = (): CrimeIncidentLive => {
    const types = ['Theft', 'Burglary', 'Robbery', 'Assault', 'Vehicle Theft', 'Drug Related'];
    const locations = ['Anna Nagar', 'T.Nagar', 'Velachery', 'Tambaram', 'Central Chennai', 'Adyar'];
    const districts = ['North', 'Central', 'South', 'West', 'East'];
    const severities: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'medium', 'high', 'critical'];
    const statuses: Array<'reported' | 'investigating' | 'resolved'> = ['reported', 'investigating', 'resolved'];
    
    return {
      id: `incident-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: types[Math.floor(Math.random() * types.length)],
      location: locations[Math.floor(Math.random() * locations.length)],
      district: districts[Math.floor(Math.random() * districts.length)] + ' Chennai',
      severity: severities[Math.floor(Math.random() * severities.length)],
      timestamp: new Date(),
      description: `Reported ${types[Math.floor(Math.random() * types.length)].toLowerCase()} incident requiring immediate attention`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      unitAssigned: Math.random() > 0.3 ? `Unit-${Math.floor(Math.random() * 99) + 1}` : undefined,
      responseTime: Math.random() > 0.5 ? Math.floor(Math.random() * 30) + 5 : undefined
    };
  };

  // Simulate real-time updates
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const newIncident = generateMockIncident();
      setIncidents(prev => [newIncident, ...prev.slice(0, maxItems - 1)]);
      setLastUpdate(new Date());
      
      // Play notification sound for high/critical incidents
      if (soundEnabled && ['high', 'critical'].includes(newIncident.severity)) {
        // In a real implementation, play audio notification
        console.log('🚨 High priority incident detected:', newIncident);
      }
    }, Math.random() * 10000 + 5000); // Random interval between 5-15 seconds

    return () => clearInterval(interval);
  }, [isLive, soundEnabled, maxItems]);

  // Initialize with some mock data
  useEffect(() => {
    const initialIncidents = Array.from({ length: 5 }, () => generateMockIncident());
    setIncidents(initialIncidents);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500 text-white animate-pulse';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-black';
      case 'low':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reported':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'investigating':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Radio className={`w-5 h-5 ${isLive ? 'text-green-500 animate-pulse' : 'text-gray-400'}`} />
            <h3 className="text-lg font-semibold text-foreground">
              Live Crime Feed
            </h3>
          </div>
          {isLive && (
            <Badge variant="secondary" className="text-xs animate-pulse">
              LIVE
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="h-8 w-8 p-0"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
          <Button
            size="sm"
            variant={isLive ? "default" : "secondary"}
            onClick={() => setIsLive(!isLive)}
            className="flex items-center gap-1"
          >
            {isLive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {isLive ? 'Pause' : 'Resume'}
          </Button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground mb-4 flex items-center gap-2">
        <Clock className="w-3 h-3" />
        Last updated: {formatDistanceToNow(lastUpdate, { addSuffix: true })}
        <span className="ml-2">•</span>
        <span>{incidents.length} active incidents</span>
      </div>

      <ScrollArea className="h-96">
        <div className="space-y-3">
          {incidents.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No incidents to display</p>
            </div>
          ) : (
            incidents.map((incident, index) => (
              <div key={incident.id}>
                <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${getSeverityColor(incident.severity)}`} />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground">
                          {incident.type}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getSeverityColor(incident.severity)}`}
                        >
                          {incident.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getStatusColor(incident.status)}`}
                      >
                        {incident.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{incident.location}, {incident.district}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDistanceToNow(incident.timestamp, { addSuffix: true })}</span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {incident.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs">
                      {incident.unitAssigned && (
                        <span className="text-primary font-medium">
                          Assigned: {incident.unitAssigned}
                        </span>
                      )}
                      {incident.responseTime && (
                        <span className="text-accent">
                          Response: {incident.responseTime}min
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 flex-shrink-0"
                  >
                    <TrendingUp className="w-3 h-3" />
                  </Button>
                </div>
                {index < incidents.length - 1 && <Separator />}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span>Critical</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <span>High</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>Low</span>
        </div>
      </div>
    </Card>
  );
}
