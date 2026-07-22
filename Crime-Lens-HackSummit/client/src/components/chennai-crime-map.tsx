import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Import leaflet.heat plugin
import 'leaflet.heat';
import type { CrimeStats, District } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';

// Fix for default markers in React-Leaflet
// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Chennai coordinates and district locations
const CHENNAI_CENTER: [number, number] = [13.0827, 80.2707];

// Performance optimization constants
// Limiting data to 500 records for optimal rendering performance and reduced memory usage
// This prevents the application from becoming sluggish when dealing with large datasets (originally 50k+ records)
const MAX_CRIME_DATA_LIMIT = 500;

// Chennai district coordinates (approximate centers)
const DISTRICT_COORDINATES: Record<string, [number, number]> = {
  'central': [13.0827, 80.2707], // Central Chennai
  'north': [13.1317, 80.2977], // North Chennai
  'south': [12.9141, 80.2227], // South Chennai
  'tambaram': [12.9249, 80.1000], // Tambaram
  'avadi': [13.1147, 80.0977], // Avadi
  'anna-nagar': [13.0850, 80.2101], // Anna Nagar
  't-nagar': [13.0417, 80.2341], // T.Nagar
  'velachery': [12.9745, 80.2197], // Velachery
};

// Crime intensity colors
const getCrimeIntensityColor = (totalIncidents: number): string => {
  if (totalIncidents > 1000) return '#dc2626'; // High intensity - red
  if (totalIncidents > 500) return '#f97316'; // Medium-high intensity - orange
  if (totalIncidents > 200) return '#eab308'; // Medium intensity - yellow
  return '#22c55e'; // Low intensity - green
};

// Get circle radius based on crime count
const getCrimeRadius = (totalIncidents: number): number => {
  if (totalIncidents > 1000) return 15;
  if (totalIncidents > 500) return 12;
  if (totalIncidents > 200) return 8;
  return 5;
};

// Get heatmap intensity based on crime severity
const getHeatmapIntensity = (severity: string): number => {
  switch (severity?.toLowerCase()) {
    case 'high': return 1.0;
    case 'medium': return 0.6;
    case 'low': return 0.3;
    default: return 0.5;
  }
};

interface ChennaiCrimeMapProps {
  crimeStats: CrimeStats[];
  districts: District[];
  selectedDistrict?: string;
  selectedSeverity?: string;
  selectedCategories?: string[];
  mapViewMode?: string;
  className?: string;
}

// Heatmap Layer Component
function HeatmapLayer({ heatmapData }: { heatmapData: [number, number, number][] }) {
  const map = useMap();
  const heatmapRef = useRef<any>(null);

  useEffect(() => {
    console.log('HeatmapLayer: Processing data', heatmapData.length, 'points');
    
    // Remove existing heatmap layer if it exists
    if (heatmapRef.current) {
      map.removeLayer(heatmapRef.current);
      heatmapRef.current = null;
    }

    if (heatmapData.length > 0) {
      try {
        // Check if leaflet.heat is available
        if (!(L as any).heatLayer) {
          console.warn('leaflet.heat plugin not available, using fallback visualization');
          return;
        }

        console.log('Creating heatmap with', heatmapData.length, 'data points');
        console.log('Sample data points:', heatmapData.slice(0, 3));
        
        // Create new heatmap layer with enhanced settings
        heatmapRef.current = (L as any).heatLayer(heatmapData, {
          radius: 30,
          blur: 20,
          maxZoom: 18,
          max: 1.0,
          minOpacity: 0.1,
          gradient: {
            0.0: '#0000ff',  // Blue for low intensity
            0.2: '#00ffff',  // Cyan
            0.4: '#00ff00',  // Green
            0.6: '#ffff00',  // Yellow
            0.8: '#ff8000',  // Orange
            1.0: '#ff0000'   // Red for high intensity
          }
        }).addTo(map);
        
        console.log('Heatmap layer created successfully');
      } catch (error) {
        console.error('Error creating heatmap:', error);
      }
    } else {
      console.log('No heatmap data to display');
    }

    // Cleanup function
    return () => {
      if (heatmapRef.current) {
        try {
          map.removeLayer(heatmapRef.current);
          console.log('Heatmap layer removed');
        } catch (error) {
          console.error('Error removing heatmap:', error);
        }
        heatmapRef.current = null;
      }
    };
  }, [map, heatmapData]);

  return null;
}

// Component to update map view when selectedDistrict changes
function MapUpdater({ selectedDistrict, districts }: { selectedDistrict: string; districts: District[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (selectedDistrict !== 'all') {
      const district = districts.find(d => d.id === selectedDistrict);
      if (district && (district as any).avgLatitude && (district as any).avgLongitude) {
        map.setView([(district as any).avgLatitude, (district as any).avgLongitude], 13);
      } else {
        // Fallback to hardcoded coordinates if no lat/lng in data
        const fallbackCoords = DISTRICT_COORDINATES[selectedDistrict];
        if (fallbackCoords) {
          map.setView(fallbackCoords, 13);
        }
      }
    } else {
      map.setView(CHENNAI_CENTER, 11);
    }
  }, [selectedDistrict, districts, map]);
  
  return null;
}

export function ChennaiCrimeMap({ 
  crimeStats, 
  districts, 
  selectedDistrict = 'all',
  selectedSeverity = 'all',
  selectedCategories = [],
  mapViewMode = 'markers',
  className = "h-80 w-full rounded-lg"
}: ChennaiCrimeMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const [mapData, setMapData] = useState<any[]>([]);
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<[number, number, number][]>([]);

  // Fetch real crime data for map
  const { data: crimeData, isLoading: isLoadingCrimeData } = useQuery({
    queryKey: ['/api/mongodb/map-data', selectedDistrict, selectedSeverity, selectedCategories],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedDistrict !== 'all') {
        // Use district parameter instead of ward
        params.append('district', selectedDistrict);
      }
      if (selectedSeverity !== 'all') {
        params.append('severity', selectedSeverity);
      }
      if (selectedCategories.length > 0) {
        // For now, we'll filter on the frontend since the API doesn't support multiple crime types
        // In a real implementation, you'd want to modify the API to accept multiple crime types
      }
      params.append('limit', MAX_CRIME_DATA_LIMIT.toString()); // Optimized limit for better performance
      
      const response = await fetch(`/api/mongodb/map-data?${params}`);
      if (!response.ok) throw new Error('Failed to fetch crime data');
      return response.json();
    },
    enabled: districts.length > 0
  });

  // Fetch crime hotspots
  const { data: hotspotsData } = useQuery({
    queryKey: ['/api/mongodb/crime-hotspots'],
    queryFn: async () => {
      const response = await fetch('/api/mongodb/crime-hotspots?limit=15');
      if (!response.ok) throw new Error('Failed to fetch hotspots');
      return response.json();
    }
  });

  useEffect(() => {
    if (crimeData) {
      let filteredData = crimeData;
      
      // Filter by selected categories on frontend
      if (selectedCategories.length > 0) {
        filteredData = crimeData.filter((crime: any) => 
          selectedCategories.some(category => 
            crime.crime_type.toLowerCase().includes(category.toLowerCase())
          )
        );
      }
      
      setMapData(filteredData);
    }
  }, [crimeData, selectedCategories]);

  useEffect(() => {
    if (hotspotsData) {
      setHotspots(hotspotsData);
    }
  }, [hotspotsData]);

  // Calculate total incidents per district
  const districtCrimeData = React.useMemo(() => {
    const data: Record<string, number> = {};
    
    districts.forEach(district => {
      let totalIncidents = 0;
      crimeStats.forEach(stat => {
        const districtIncidents = stat.incidents.filter(
          incident => incident.districtId === district.id
        );
        totalIncidents += districtIncidents.reduce((sum, incident) => sum + incident.count, 0);
      });
      data[district.id] = totalIncidents;
    });
    
    return data;
  }, [crimeStats, districts]);

  // Memoize limited crime data for rendering
  const limitedMapData = React.useMemo(() => {
    return mapData.slice(0, MAX_CRIME_DATA_LIMIT);
  }, [mapData]);

  // Process crime data for heatmap
  useEffect(() => {
    console.log('Processing heatmap data. Limited map data:', limitedMapData.length, 'points');
    const processedHeatmapData: [number, number, number][] = [];
    
    // Process individual crime incidents
    if (limitedMapData.length > 0) {
      limitedMapData.forEach(crime => {
        if (crime.latitude && crime.longitude) {
          const intensity = getHeatmapIntensity(crime.severity);
          processedHeatmapData.push([crime.latitude, crime.longitude, intensity]);
        }
      });
      console.log('Added', limitedMapData.length, 'crime incident points to heatmap');
    }
    
    // Always add district-level data for better visualization
    districts.forEach(district => {
      const districtCoords = DISTRICT_COORDINATES[district.id];
      if (districtCoords) {
        const districtIncidents = districtCrimeData[district.id] || 0;
        // Ensure minimum visibility with at least 0.1 intensity
        const intensity = Math.min(Math.max(districtIncidents / 1000, 0.2), 1.0);
        processedHeatmapData.push([districtCoords[0], districtCoords[1], intensity]);
      }
    });
    
    // Add some sample data if we don't have enough points
    if (processedHeatmapData.length < 5) {
      console.log('Adding sample heatmap data for visualization');
      // Add sample points around Chennai for demonstration
      const samplePoints: [number, number, number][] = [
        [13.0827, 80.2707, 0.8], // Central Chennai - High intensity
        [13.0417, 80.2341, 0.9], // T.Nagar - Very high intensity
        [13.0850, 80.2101, 0.6], // Anna Nagar - Medium intensity
        [12.9745, 80.2197, 0.5], // Velachery - Medium intensity
        [13.1317, 80.2977, 0.7], // North Chennai - High intensity
        [12.9141, 80.2227, 0.4], // South Chennai - Low-medium intensity
        [12.9249, 80.1000, 0.3], // Tambaram - Low intensity
        [13.1147, 80.0977, 0.5], // Avadi - Medium intensity
      ];
      processedHeatmapData.push(...samplePoints);
    }
    
    console.log('Total heatmap data points:', processedHeatmapData.length);
    setHeatmapData(processedHeatmapData);
  }, [limitedMapData, districts, districtCrimeData]);

  // Filter districts based on selection
  const filteredDistricts = React.useMemo(() => {
    if (selectedDistrict === 'all') return districts;
    return districts.filter(district => district.id === selectedDistrict);
  }, [districts, selectedDistrict]);

  // Create hotspot markers for high-crime areas
  const hotspotMarkers = React.useMemo(() => {
    const hotspots: Array<{ 
      position: [number, number]; 
      name: string; 
      severity: 'high' | 'medium' | 'low';
      incidents: number;
    }> = [];

    // Add major hotspots based on crime statistics
    if (districtCrimeData['t-nagar'] > 800) {
      hotspots.push({
        position: [13.0417, 80.2341],
        name: 'T.Nagar Commercial District',
        severity: 'high',
        incidents: districtCrimeData['t-nagar']
      });
    }

    if (districtCrimeData['central'] > 700) {
      hotspots.push({
        position: [13.0827, 80.2707],
        name: 'Central Chennai',
        severity: 'high',
        incidents: districtCrimeData['central']
      });
    }

    if (districtCrimeData['anna-nagar'] > 400) {
      hotspots.push({
        position: [13.0850, 80.2101],
        name: 'Anna Nagar Residential',
        severity: 'medium',
        incidents: districtCrimeData['anna-nagar']
      });
    }

    if (districtCrimeData['velachery'] > 300) {
      hotspots.push({
        position: [12.9745, 80.2197],
        name: 'Velachery IT Corridor',
        severity: 'medium',
        incidents: districtCrimeData['velachery']
      });
    }

    return hotspots;
  }, [districtCrimeData]);

  // Create custom icons for different crime types
  const createCrimeIcon = (crimeType: string, severity: string) => {
    const color = severity === 'high' ? '#dc2626' : severity === 'medium' ? '#f59e0b' : '#10b981';
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="
        background-color: ${color};
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });
  };

  if (isLoadingCrimeData) {
    return (
      <div className={className}>
        <div className="h-full w-full rounded-lg bg-muted animate-pulse flex items-center justify-center">
          <div className="text-muted-foreground">Loading crime data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <MapContainer
        center={CHENNAI_CENTER}
        zoom={11}
        className="h-full w-full rounded-lg"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater selectedDistrict={selectedDistrict} districts={districts} />

        {/* Heatmap Layer */}
        {mapViewMode === 'heatmap' && (
          <>
            <HeatmapLayer heatmapData={heatmapData} />
            {/* Fallback heatmap using CircleMarkers if leaflet.heat fails */}
            {heatmapData.map((point, index) => {
              const [lat, lng, intensity] = point;
              const color = intensity > 0.8 ? '#ff0000' : 
                           intensity > 0.6 ? '#ff8000' : 
                           intensity > 0.4 ? '#ffff00' : 
                           intensity > 0.2 ? '#00ff00' : '#0000ff';
              return (
                <CircleMarker
                  key={`heatpoint-${index}`}
                  center={[lat, lng]}
                  radius={Math.max(intensity * 15, 3)}
                  pathOptions={{
                    fillColor: color,
                    color: color,
                    weight: 1,
                    opacity: 0.6,
                    fillOpacity: 0.4
                  }}
                />
              );
            })}
          </>
        )}

        {/* District Crime Circles - only show in markers mode */}
        {mapViewMode === 'markers' && filteredDistricts.map((district) => {
          // Use actual coordinates from MongoDB if available, otherwise fallback to hardcoded
          const position = ((district as any).avgLatitude && (district as any).avgLongitude) 
            ? [(district as any).avgLatitude, (district as any).avgLongitude] as [number, number]
            : DISTRICT_COORDINATES[district.id];
          
          if (!position) return null;

          const incidents = (district as any).totalIncidents || districtCrimeData[district.id] || 0;
          const color = getCrimeIntensityColor(incidents);
          const radius = getCrimeRadius(incidents);

          return (
            <CircleMarker
              key={district.id}
              center={position}
              radius={radius}
              pathOptions={{
                fillColor: color,
                color: color,
                weight: 2,
                opacity: 0.8,
                fillOpacity: 0.6
              }}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-foreground">{district.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Population: {district.population.toLocaleString()}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Total Incidents:</span> {incidents}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {district.region} Region
                  </p>
                  {(district as any).highSeverityCount > 0 && (
                    <p className="text-xs text-red-600 mt-1">
                      High Severity: {(district as any).highSeverityCount}
                    </p>
                  )}
                </div>
              </Popup>
              <Tooltip permanent={radius > 10}>
                <div className="text-xs">
                  <div className="font-medium">{district.name}</div>
                  <div>{incidents} incidents</div>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}

        {/* Real Crime Data Markers - only show in markers mode */}
        {mapViewMode === 'markers' &&
        limitedMapData.map((crime, index) => (
          <Marker 
            key={`crime-${index}`} 
            position={[crime.latitude, crime.longitude]}
            icon={createCrimeIcon(crime.crime_type, crime.severity)}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <h3 className="font-semibold text-foreground mb-2">{crime.crime_type}</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-medium">Severity:</span> 
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      crime.severity === 'high' ? 'bg-red-100 text-red-800' :
                      crime.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {crime.severity}
                    </span>
                  </p>
                  <p><span className="font-medium">Ward:</span> {crime.ward}</p>
                  <p><span className="font-medium">Date:</span> {new Date(crime.date).toLocaleDateString()}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {crime.description}
                  </p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Crime Hotspot Markers - only show in markers mode */}
        {mapViewMode === 'markers' && hotspots.map((hotspot, index) => (
          <Marker key={`hotspot-${index}`} position={[hotspot.latitude, hotspot.longitude]}>
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-foreground">Crime Hotspot</h3>
                <p className="text-sm">
                  <span className="font-medium">Incidents:</span> {hotspot.incidentCount}
                </p>
                <p className="text-sm">
                  <span className="font-medium">High Severity:</span> {hotspot.highSeverityCount}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Crime Types: {hotspot.crimeTypes.join(', ')}
                </p>
                <p className="text-xs text-muted-foreground">
                  Wards: {hotspot.wards.join(', ')}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
