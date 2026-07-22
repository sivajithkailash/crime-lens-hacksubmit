import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  Clock,
  Calendar,
  MapPin,
  Zap,
  ThermometerSun,
  Users,
  RefreshCw
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

interface HotspotPrediction {
  id: string;
  area: string;
  district: string;
  coordinates: [number, number];
  riskLevel: 'very-high' | 'high' | 'medium' | 'low';
  probability: number;
  predictionWindow: '6h' | '12h' | '24h' | '48h' | '7d';
  factors: {
    historical: number;
    temporal: number;
    weather: number;
    events: number;
    social: number;
  };
  crimeTypes: string[];
  confidence: number;
  lastUpdated: Date;
}

interface PredictiveFactors {
  name: string;
  current: number;
  impact: 'high' | 'medium' | 'low';
  trend: 'up' | 'down' | 'stable';
}

interface PredictiveHotspotAnalysisProps {
  className?: string;
}

export function PredictiveHotspotAnalysis({ className = "" }: PredictiveHotspotAnalysisProps) {
  const [predictions, setPredictions] = useState<HotspotPrediction[]>([]);
  const [timeWindow, setTimeWindow] = useState<'6h' | '12h' | '24h' | '48h' | '7d'>('24h');
  const [isLoading, setIsLoading] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<Date>(new Date());
  
  // Fetch real districts for consistent naming
  const { data: realDistricts } = useQuery({
    queryKey: ['/api/mongodb/districts'],
    queryFn: async () => {
      const response = await fetch('/api/mongodb/districts');
      if (!response.ok) throw new Error('Failed to fetch districts');
      return response.json();
    }
  });

  // Mock predictive factors
  const predictiveFactors: PredictiveFactors[] = [
    { name: 'Historical Patterns', current: 78, impact: 'high', trend: 'up' },
    { name: 'Weather Conditions', current: 65, impact: 'medium', trend: 'stable' },
    { name: 'Public Events', current: 45, impact: 'medium', trend: 'down' },
    { name: 'Social Media Sentiment', current: 82, impact: 'high', trend: 'up' },
    { name: 'Economic Indicators', current: 58, impact: 'medium', trend: 'stable' },
    { name: 'Traffic Patterns', current: 71, impact: 'medium', trend: 'up' }
  ];

  // Mock data generator
  const generatePredictions = (): HotspotPrediction[] => {
    const areas = [
      'T.Nagar Commercial Center',
      'Anna Nagar Metro Station',
      'Central Railway Station',
      'Marina Beach Area',
      'Velachery IT Park',
      'Tambaram Bus Stand',
      'Express Avenue Mall',
      'Phoenix MarketCity'
    ];
    
    // Use real district names if available, otherwise fallback
    const districts = realDistricts?.map(d => d.name) || ['North Chennai', 'Central Chennai', 'South Chennai', 'Avadi', 'T.Nagar', 'Anna Nagar', 'Velachery', 'Tambaram'];
    const riskLevels: Array<'very-high' | 'high' | 'medium' | 'low'> = ['very-high', 'high', 'medium', 'low'];
    const crimeTypes = ['Theft', 'Pickpocketing', 'Vehicle Crime', 'Burglary', 'Robbery'];

    return areas.map((area, index) => ({
      id: `prediction-${index}`,
      area,
      district: districts[Math.floor(Math.random() * districts.length)],
      coordinates: [13.0827 + (Math.random() - 0.5) * 0.2, 80.2707 + (Math.random() - 0.5) * 0.3] as [number, number],
      riskLevel: riskLevels[Math.floor(Math.random() * riskLevels.length)],
      probability: Math.floor(Math.random() * 40) + 60,
      predictionWindow: timeWindow,
      factors: {
        historical: Math.floor(Math.random() * 30) + 70,
        temporal: Math.floor(Math.random() * 40) + 30,
        weather: Math.floor(Math.random() * 50) + 25,
        events: Math.floor(Math.random() * 60) + 20,
        social: Math.floor(Math.random() * 45) + 35
      },
      crimeTypes: crimeTypes.slice(0, Math.floor(Math.random() * 3) + 2),
      confidence: Math.floor(Math.random() * 20) + 75,
      lastUpdated: new Date()
    }));
  };

  // Generate predictions on mount and when timeWindow changes
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setPredictions(generatePredictions());
      setLastAnalysis(new Date());
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeWindow]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading) {
        setPredictions(generatePredictions());
        setLastAnalysis(new Date());
      }
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [isLoading]);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'very-high':
        return 'bg-red-500 text-white';
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

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'medium':
        return <Target className="w-4 h-4 text-yellow-500" />;
      case 'low':
        return <Zap className="w-4 h-4 text-green-500" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-3 h-3 text-red-500" />;
      case 'down':
        return <TrendingUp className="w-3 h-3 text-green-500 rotate-180" />;
      default:
        return <div className="w-3 h-3 bg-gray-400 rounded-full" />;
    }
  };

  // Prepare chart data
  const chartData = useMemo(() => {
    return predictions.slice(0, 6).map(pred => ({
      area: pred.area.split(' ').slice(0, 2).join(' '),
      probability: pred.probability,
      confidence: pred.confidence,
      historical: pred.factors.historical,
      temporal: pred.factors.temporal,
      weather: pred.factors.weather,
      events: pred.factors.events,
      social: pred.factors.social
    }));
  }, [predictions]);

  const radarData = useMemo(() => {
    if (predictions.length === 0) return [];
    
    const avgFactors = predictions.reduce(
      (acc, pred) => ({
        historical: acc.historical + pred.factors.historical,
        temporal: acc.temporal + pred.factors.temporal,
        weather: acc.weather + pred.factors.weather,
        events: acc.events + pred.factors.events,
        social: acc.social + pred.factors.social
      }),
      { historical: 0, temporal: 0, weather: 0, events: 0, social: 0 }
    );

    const count = predictions.length;
    return [
      { factor: 'Historical', value: Math.round(avgFactors.historical / count) },
      { factor: 'Temporal', value: Math.round(avgFactors.temporal / count) },
      { factor: 'Weather', value: Math.round(avgFactors.weather / count) },
      { factor: 'Events', value: Math.round(avgFactors.events / count) },
      { factor: 'Social', value: Math.round(avgFactors.social / count) }
    ];
  }, [predictions]);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setPredictions(generatePredictions());
      setLastAnalysis(new Date());
      setIsLoading(false);
    }, 1000);
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Predictive Hotspot Analysis
            </h3>
            <p className="text-sm text-muted-foreground">
              AI-powered crime prediction for Chennai districts
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeWindow} onValueChange={(value: any) => setTimeWindow(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6h">Next 6 Hours</SelectItem>
              <SelectItem value="12h">Next 12 Hours</SelectItem>
              <SelectItem value="24h">Next 24 Hours</SelectItem>
              <SelectItem value="48h">Next 48 Hours</SelectItem>
              <SelectItem value="7d">Next 7 Days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground mb-6 flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>Last Analysis: {lastAnalysis.toLocaleTimeString()}</span>
        </div>
        <div className="flex items-center gap-1">
          <Target className="w-3 h-3" />
          <span>{predictions.filter(p => p.riskLevel === 'high' || p.riskLevel === 'very-high').length} High Risk Areas</span>
        </div>
      </div>

      <Tabs defaultValue="predictions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="factors">Risk Factors</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {isLoading ? (
              <div className="col-span-2 text-center py-8">
                <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-3 animate-pulse" />
                <p className="text-muted-foreground">Analyzing crime patterns...</p>
              </div>
            ) : (
              predictions.slice(0, 8).map((prediction) => (
                <div 
                  key={prediction.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="font-medium text-foreground text-sm mb-1">
                        {prediction.area}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {prediction.district}
                      </div>
                    </div>
                    <Badge className={getRiskColor(prediction.riskLevel)}>
                      {prediction.riskLevel.replace('-', ' ').toUpperCase()}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-xs">
                      <span>Risk Probability</span>
                      <span className="font-medium">{prediction.probability}%</span>
                    </div>
                    <Progress value={prediction.probability} className="h-2" />
                  </div>

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Confidence: {prediction.confidence}%</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeWindow === '6h' ? '6h' : 
                       timeWindow === '12h' ? '12h' : 
                       timeWindow === '24h' ? '24h' : 
                       timeWindow === '48h' ? '48h' : '7d'}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1">
                    {prediction.crimeTypes.slice(0, 3).map((type) => (
                      <Badge key={type} variant="secondary" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="factors" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-foreground">Predictive Factors</h4>
              {predictiveFactors.map((factor) => (
                <div key={factor.name} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getImpactIcon(factor.impact)}
                      <span className="text-sm font-medium">{factor.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(factor.trend)}
                      <span className="text-sm font-medium">{factor.current}%</span>
                    </div>
                  </div>
                  <Progress value={factor.current} className="h-2" />
                </div>
              ))}
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-4">Factor Analysis</h4>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="factor" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar
                    name="Risk Factors"
                    dataKey="value"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.3}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-foreground mb-4">Risk Probability Distribution</h4>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="area" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="probability"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.4}
                    name="Probability %"
                  />
                  <Area
                    type="monotone"
                    dataKey="confidence"
                    stackId="2"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    fillOpacity={0.4}
                    name="Confidence %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-4">Contributing Factors</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="area" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="historical" stroke="#8884d8" name="Historical" />
                  <Line type="monotone" dataKey="temporal" stroke="#82ca9d" name="Temporal" />
                  <Line type="monotone" dataKey="weather" stroke="#ffc658" name="Weather" />
                  <Line type="monotone" dataKey="social" stroke="#ff7300" name="Social" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span className="font-medium">High Risk Areas</span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {predictions.filter(p => p.riskLevel === 'high' || p.riskLevel === 'very-high').length}
              </div>
              <div className="text-xs text-muted-foreground">Require immediate attention</div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-blue-500" />
                <span className="font-medium">Average Confidence</span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {Math.round(predictions.reduce((acc, p) => acc + p.confidence, 0) / predictions.length || 0)}%
              </div>
              <div className="text-xs text-muted-foreground">Model accuracy</div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-5 h-5 text-purple-500" />
                <span className="font-medium">Predictions Made</span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {predictions.length}
              </div>
              <div className="text-xs text-muted-foreground">For {timeWindow} window</div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
