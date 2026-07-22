import { Card } from "@/components/ui/card";
import { Brain, TrendingUp, Target, BarChart3 } from "lucide-react";
import type { AiInsight } from "@shared/schema";

interface AiInsightsPanelProps {
  insights: AiInsight[];
}

export function AiInsightsPanel({ insights }: AiInsightsPanelProps) {
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'pattern':
        return <BarChart3 className="w-4 h-4" />;
      case 'prediction':
        return <TrendingUp className="w-4 h-4" />;
      case 'optimization':
        return <Target className="w-4 h-4" />;
      default:
        return <Brain className="w-4 h-4" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'pattern':
        return 'bg-accent/10 border-accent/20';
      case 'prediction':
        return 'bg-primary/10 border-primary/20';
      case 'optimization':
        return 'bg-muted/50 border-border';
      default:
        return 'bg-secondary/10 border-secondary/20';
    }
  };

  return (
    <Card className="p-6" data-testid="panel-insights">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Brain className="w-5 h-5 text-accent" />
        AI Insights
      </h3>
      
      {insights.length === 0 ? (
        <div className="text-center py-8">
          <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No AI insights available</p>
        </div>
      ) : (
        <div className="space-y-4">
          {insights.map((insight) => (
            <div 
              key={insight.id}
              className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}
              data-testid={`insight-${insight.id}`}
            >
              <div className="font-medium text-foreground text-sm mb-2 flex items-center gap-2">
                {getInsightIcon(insight.type)}
                <span data-testid={`text-insight-title-${insight.id}`}>
                  {insight.title}
                </span>
                {insight.confidence && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    {insight.confidence}% confidence
                  </span>
                )}
              </div>
              <div className="text-sm text-muted-foreground" data-testid={`text-insight-description-${insight.id}`}>
                {insight.description}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
