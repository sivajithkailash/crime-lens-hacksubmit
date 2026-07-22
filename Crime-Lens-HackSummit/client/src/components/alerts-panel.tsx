import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import type { CrimeAlert } from "@shared/schema";

interface AlertsPanelProps {
  alerts: CrimeAlert[];
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  const formatTimeAgo = (createdAt: Date | string) => {
    const now = new Date();
    const date = createdAt instanceof Date ? createdAt : new Date(createdAt);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-destructive/10 border-destructive/20 text-destructive';
      case 'medium':
        return 'bg-primary/10 border-primary/20 text-primary';
      case 'low':
        return 'bg-accent/10 border-accent/20 text-accent';
      default:
        return 'bg-muted/50 border-border text-muted-foreground';
    }
  };

  const getPriorityDotColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-destructive';
      case 'medium':
        return 'bg-primary';
      case 'low':
        return 'bg-accent';
      default:
        return 'bg-muted-foreground';
    }
  };

  return (
    <Card className="p-6" data-testid="panel-alerts">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-primary" />
        Active Alerts
      </h3>
      
      {alerts.length === 0 ? (
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No active alerts at this time</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div 
              key={alert.id}
              className={`flex items-start gap-3 p-3 rounded-lg border ${getPriorityColor(alert.priority)}`}
              data-testid={`alert-${alert.id}`}
            >
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getPriorityDotColor(alert.priority)}`}></div>
              <div className="flex-1">
                <div className="font-medium text-foreground text-sm" data-testid={`text-alert-title-${alert.id}`}>
                  {alert.title}
                </div>
                <div className="text-xs text-muted-foreground mt-1" data-testid={`text-alert-description-${alert.id}`}>
                  {alert.description}
                </div>
                <div className={`text-xs mt-2 capitalize font-medium`} data-testid={`text-alert-priority-${alert.id}`}>
                  Priority: {alert.priority} • {alert.createdAt ? formatTimeAgo(alert.createdAt) : 'Recently'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
