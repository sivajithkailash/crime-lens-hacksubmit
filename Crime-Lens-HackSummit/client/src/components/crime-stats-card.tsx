import { Card } from "@/components/ui/card";
import { CrimeTrendChart } from "@/components/crime-trend-chart";
import { TrendingUp, TrendingDown, Info } from "lucide-react";
import type { CrimeStats } from "@shared/schema";

interface CrimeStatsCardProps {
  crimeStats: CrimeStats;
}

export function CrimeStatsCard({ crimeStats }: CrimeStatsCardProps) {
  const { category, totalCount, changePercent, hotspots, monthlyData } = crimeStats;
  const isIncreasing = changePercent > 0;

  return (
    <Card className="p-6 border border-border hover:border-primary/50 transition-colors" data-testid={`card-crime-${category.id}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div 
            className="w-5 h-5 rounded flex items-center justify-center text-xs"
            style={{ backgroundColor: category.color }}
          >
            {category.icon.includes('user-secret') ? '👤' :
             category.icon.includes('home') ? '🏠' :
             category.icon.includes('mask') ? '🎭' :
             category.icon.includes('fist') ? '👊' :
             '💊'}
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {category.name}
          </span>
        </div>
        <Info className="w-4 h-4 text-muted-foreground" />
      </div>

      <div className="mb-4">
        <div className="text-2xl font-bold text-foreground mb-1" data-testid={`text-count-${category.id}`}>
          {totalCount.toLocaleString()}
        </div>
        <div className="text-xs text-muted-foreground">JAN-NOV 2024</div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1">
          {isIncreasing ? (
            <TrendingUp className="w-3 h-3 text-destructive" />
          ) : (
            <TrendingDown className="w-3 h-3 text-accent" />
          )}
          <span className={`text-xs font-medium ${isIncreasing ? 'crime-trend-up' : 'crime-trend-down'}`} data-testid={`text-change-${category.id}`}>
            {isIncreasing ? '+' : ''}{changePercent.toFixed(1)}%
          </span>
        </div>
        <div className="text-xs text-muted-foreground">PER 1,000 RESIDENTS</div>
      </div>

      <div className="h-24 mb-3">
        <CrimeTrendChart crimeStats={[crimeStats]} height={96} showLegend={false} />
      </div>

      <div className="text-xs text-muted-foreground" data-testid={`text-hotspots-${category.id}`}>
        HOTSPOT: {hotspots.slice(0, 2).join(' • ').toUpperCase()}
      </div>
    </Card>
  );
}
