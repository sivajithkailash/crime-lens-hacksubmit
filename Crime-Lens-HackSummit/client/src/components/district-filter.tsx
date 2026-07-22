import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { District } from "@shared/schema";

interface DistrictFilterProps {
  districts: District[];
  selectedDistrict: string;
  onDistrictChange: (districtId: string) => void;
}

export function DistrictFilter({ districts, selectedDistrict, onDistrictChange }: DistrictFilterProps) {
  // Sort districts by incident count (if available)
  const sortedDistricts = [...districts].sort((a, b) => {
    const aIncidents = (a as any).totalIncidents || 0;
    const bIncidents = (b as any).totalIncidents || 0;
    return bIncidents - aIncidents;
  });

  return (
    <div className="space-y-3">
      <Button
        className={`w-full text-left justify-between px-3 py-2 text-sm font-medium ${
          selectedDistrict === 'all' 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted'
        }`}
        onClick={() => onDistrictChange('all')}
        data-testid="button-district-all"
      >
        <span>All Districts</span>
        <Badge variant="secondary" className="text-xs">
          {districts.reduce((sum, d) => sum + ((d as any).totalIncidents || 0), 0)}
        </Badge>
      </Button>
      
      {sortedDistricts.map((district) => {
        const totalIncidents = (district as any).totalIncidents || 0;
        const highSeverity = (district as any).highSeverityCount || 0;
        
        return (
          <Button
            key={district.id}
            className={`w-full text-left justify-between px-3 py-2 text-sm ${
              selectedDistrict === district.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            onClick={() => onDistrictChange(district.id)}
            data-testid={`button-district-${district.id}`}
          >
            <div className="flex flex-col items-start">
              <span className="font-medium">{district.name}</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">
                  {totalIncidents} incidents
                </span>
                {highSeverity > 0 && (
                  <Badge variant="destructive" className="text-xs px-1 py-0">
                    {highSeverity} high
                  </Badge>
                )}
              </div>
            </div>
            <Badge 
              variant={totalIncidents > 1000 ? "destructive" : totalIncidents > 500 ? "default" : "secondary"}
              className="text-xs"
            >
              {totalIncidents}
            </Badge>
          </Button>
        );
      })}
    </div>
  );
}
