import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Route, 
  Shield, 
  Users, 
  Car, 
  MapPin, 
  Clock,
  Zap,
  Target,
  TrendingUp,
  AlertTriangle,
  Navigation,
  Radio,
  Bike,
  Truck,
  RefreshCw
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface PatrolRoute {
  id: string;
  name: string;
  districts: string[];
  priority: 'high' | 'medium' | 'low';
  estimatedTime: number; // minutes
  riskScore: number;
  crimeTypes: string[];
  waypoints: Array<{
    location: string;
    coordinates: [number, number];
    duration: number; // minutes to spend at location
    activities: string[];
  }>;
  assignedUnits: string[];
  efficiency: number; // percentage
  status: 'active' | 'planned' | 'completed';
}

interface Resource {
  id: string;
  type: 'patrol_car' | 'motorcycle' | 'foot_patrol' | 'special_unit';
  callSign: string;
  currentLocation: string;
  status: 'available' | 'busy' | 'off_duty' | 'emergency';
  assignedRoute?: string;
  experience: number; // years
  specializations: string[];
  responseCapability: number; // 1-5 scale
}

interface AllocationRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  expectedImpact: number;
  resourcesNeeded: {
    patrol_cars: number;
    motorcycles: number;
    foot_patrols: number;
    special_units: number;
  };
  estimatedCost: number;
  timeframe: string;
  benefits: string[];
}

interface ResourceAllocationOptimizerProps {
  className?: string;
}

export function ResourceAllocationOptimizer({ className = "" }: ResourceAllocationOptimizerProps) {
  const [patrolRoutes, setPatrolRoutes] = useState<PatrolRoute[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [recommendations, setRecommendations] = useState<AllocationRecommendation[]>([]);
  const [optimizationMode, setOptimizationMode] = useState<'efficiency' | 'coverage' | 'response_time'>('efficiency');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [lastOptimization, setLastOptimization] = useState<Date>(new Date());

  // Mock data generators
  const generatePatrolRoutes = (): PatrolRoute[] => {
    const routeNames = [
      'Central Business District',
      'Residential North Loop',
      'Marina Beach Patrol',
      'IT Corridor Circuit',
      'Railway Station Area',
      'Commercial Market Route',
      'Educational District',
      'Industrial Zone Patrol'
    ];

    const districts = ['North Chennai', 'Central Chennai', 'South Chennai', 'West Chennai'];
    const crimeTypes = ['Theft', 'Pickpocketing', 'Vehicle Crime', 'Public Disorder'];
    const priorities: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low'];
    const statuses: Array<'active' | 'planned' | 'completed'> = ['active', 'planned', 'completed'];

    return routeNames.map((name, index) => ({
      id: `route-${index}`,
      name,
      districts: districts.slice(0, Math.floor(Math.random() * 3) + 1),
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      estimatedTime: Math.floor(Math.random() * 120) + 60,
      riskScore: Math.floor(Math.random() * 40) + 60,
      crimeTypes: crimeTypes.slice(0, Math.floor(Math.random() * 3) + 1),
      waypoints: Array.from({ length: Math.floor(Math.random() * 5) + 3 }, (_, i) => ({
        location: `Waypoint ${i + 1} - ${name}`,
        coordinates: [13.0827 + (Math.random() - 0.5) * 0.1, 80.2707 + (Math.random() - 0.5) * 0.1] as [number, number],
        duration: Math.floor(Math.random() * 15) + 5,
        activities: ['Patrol', 'Community Check', 'Security Spot Check'].slice(0, Math.floor(Math.random() * 2) + 1)
      })),
      assignedUnits: [`Unit-${Math.floor(Math.random() * 50) + 1}`, `Unit-${Math.floor(Math.random() * 50) + 1}`].slice(0, Math.floor(Math.random() * 2) + 1),
      efficiency: Math.floor(Math.random() * 30) + 70,
      status: statuses[Math.floor(Math.random() * statuses.length)]
    }));
  };

  const generateResources = (): Resource[] => {
    const types: Array<'patrol_car' | 'motorcycle' | 'foot_patrol' | 'special_unit'> = ['patrol_car', 'motorcycle', 'foot_patrol', 'special_unit'];
    const locations = ['Anna Nagar', 'T.Nagar', 'Velachery', 'Central Chennai', 'Tambaram'];
    const statuses: Array<'available' | 'busy' | 'off_duty' | 'emergency'> = ['available', 'busy', 'off_duty', 'emergency'];
    const specializations = ['Traffic Control', 'Crime Investigation', 'Community Policing', 'Emergency Response'];

    return Array.from({ length: 25 }, (_, index) => ({
      id: `resource-${index}`,
      type: types[Math.floor(Math.random() * types.length)],
      callSign: `Unit-${index + 1}`,
      currentLocation: locations[Math.floor(Math.random() * locations.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      assignedRoute: Math.random() > 0.5 ? `route-${Math.floor(Math.random() * 8)}` : undefined,
      experience: Math.floor(Math.random() * 15) + 1,
      specializations: specializations.slice(0, Math.floor(Math.random() * 2) + 1),
      responseCapability: Math.floor(Math.random() * 3) + 3
    }));
  };

  const generateRecommendations = (): AllocationRecommendation[] => {
    const recommendations = [
      {
        title: 'Increase T.Nagar Commercial Patrol',
        description: 'Deploy additional mobile units during peak shopping hours to reduce theft incidents',
        expectedImpact: 85,
        timeframe: 'Immediate (1-3 days)'
      },
      {
        title: 'Optimize Night Shift Coverage',
        description: 'Redistribute night patrol units based on recent crime pattern analysis',
        expectedImpact: 72,
        timeframe: 'Short-term (1-2 weeks)'
      },
      {
        title: 'Marina Beach Security Enhancement',
        description: 'Add specialized foot patrol units during evening hours and weekends',
        expectedImpact: 68,
        timeframe: 'Medium-term (2-4 weeks)'
      },
      {
        title: 'IT Corridor Traffic Integration',
        description: 'Coordinate with traffic police for integrated crime prevention during rush hours',
        expectedImpact: 61,
        timeframe: 'Long-term (1-2 months)'
      }
    ];

    const priorities: Array<'high' | 'medium' | 'low'> = ['high', 'high', 'medium', 'medium'];

    return recommendations.map((rec, index) => ({
      id: `rec-${index}`,
      ...rec,
      priority: priorities[index],
      resourcesNeeded: {
        patrol_cars: Math.floor(Math.random() * 3) + 1,
        motorcycles: Math.floor(Math.random() * 2) + 1,
        foot_patrols: Math.floor(Math.random() * 4) + 2,
        special_units: Math.floor(Math.random() * 2)
      },
      estimatedCost: Math.floor(Math.random() * 50000) + 25000,
      benefits: [
        'Reduced crime incidents',
        'Improved response times',
        'Enhanced public safety',
        'Better resource utilization'
      ].slice(0, Math.floor(Math.random() * 2) + 2)
    }));
  };

  // Initialize data
  useEffect(() => {
    setPatrolRoutes(generatePatrolRoutes());
    setResources(generateResources());
    setRecommendations(generateRecommendations());
  }, []);

  // Optimize allocation
  const handleOptimize = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      setPatrolRoutes(generatePatrolRoutes());
      setRecommendations(generateRecommendations());
      setLastOptimization(new Date());
      setIsOptimizing(false);
    }, 2000);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500 text-white';
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
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'busy':
        return 'bg-blue-100 text-blue-800';
      case 'off_duty':
        return 'bg-gray-100 text-gray-800';
      case 'emergency':
        return 'bg-red-100 text-red-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'planned':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'patrol_car':
        return <Car className="w-4 h-4" />;
      case 'motorcycle':
        return <Bike className="w-4 h-4" />;
      case 'foot_patrol':
        return <Users className="w-4 h-4" />;
      case 'special_unit':
        return <Shield className="w-4 h-4" />;
      default:
        return <Car className="w-4 h-4" />;
    }
  };

  // Chart data
  const resourceDistribution = useMemo(() => {
    const distribution = resources.reduce((acc, resource) => {
      acc[resource.type] = (acc[resource.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(distribution).map(([type, count]) => ({
      name: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: count,
      color: type === 'patrol_car' ? '#8884d8' : 
             type === 'motorcycle' ? '#82ca9d' :
             type === 'foot_patrol' ? '#ffc658' : '#ff7300'
    }));
  }, [resources]);

  const availabilityChart = useMemo(() => {
    const statusCounts = resources.reduce((acc, resource) => {
      acc[resource.status] = (acc[resource.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts).map(([status, count]) => ({
      status: status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count,
      percentage: Math.round((count / resources.length) * 100)
    }));
  }, [resources]);

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-600 rounded-lg flex items-center justify-center">
            <Route className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Resource Allocation Optimizer
            </h3>
            <p className="text-sm text-muted-foreground">
              AI-powered patrol routing and resource distribution
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={optimizationMode} onValueChange={(value: any) => setOptimizationMode(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="efficiency">Maximize Efficiency</SelectItem>
              <SelectItem value="coverage">Maximize Coverage</SelectItem>
              <SelectItem value="response_time">Minimize Response Time</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            onClick={handleOptimize}
            disabled={isOptimizing}
            className="flex items-center gap-2"
          >
            <Zap className={`w-4 h-4 ${isOptimizing ? 'animate-spin' : ''}`} />
            {isOptimizing ? 'Optimizing...' : 'Optimize'}
          </Button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground mb-6 flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>Last Optimization: {lastOptimization.toLocaleTimeString()}</span>
        </div>
        <div className="flex items-center gap-1">
          <Target className="w-3 h-3" />
          <span>{resources.filter(r => r.status === 'available').length} Units Available</span>
        </div>
        <div className="flex items-center gap-1">
          <Route className="w-3 h-3" />
          <span>{patrolRoutes.filter(r => r.status === 'active').length} Active Routes</span>
        </div>
      </div>

      <Tabs defaultValue="routes" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="routes">Patrol Routes</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="routes" className="space-y-4">
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {patrolRoutes.map((route) => (
                <div key={route.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="font-medium text-foreground text-sm mb-1">
                        {route.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Districts: {route.districts.join(', ')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(route.priority)}>
                        {route.priority.toUpperCase()}
                      </Badge>
                      <Badge variant="secondary" className={getStatusColor(route.status)}>
                        {route.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3 text-xs">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Duration: {route.estimatedTime}min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Risk Score: {route.riskScore}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      <span>Efficiency: {route.efficiency}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{route.waypoints.length} Waypoints</span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-xs">
                      <span>Route Efficiency</span>
                      <span className="font-medium">{route.efficiency}%</span>
                    </div>
                    <Progress value={route.efficiency} className="h-2" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {route.assignedUnits.map((unit) => (
                        <Badge key={unit} variant="outline" className="text-xs">
                          {unit}
                        </Badge>
                      ))}
                    </div>
                    <Button size="sm" variant="ghost" className="h-6">
                      <Navigation className="w-3 h-3 mr-1" />
                      View Route
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-foreground mb-4">Resource Distribution</h4>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={resourceDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                  >
                    {resourceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-4">Resource Availability</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={availabilityChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <ScrollArea className="h-64">
            <div className="space-y-2">
              {resources.slice(0, 15).map((resource) => (
                <div key={resource.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getResourceIcon(resource.type)}
                    <div>
                      <div className="font-medium text-sm">{resource.callSign}</div>
                      <div className="text-xs text-muted-foreground">{resource.currentLocation}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(resource.status)}>
                      {resource.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {resource.experience}y exp
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <div key={rec.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="font-medium text-foreground text-sm mb-1">
                      {rec.title}
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {rec.description}
                    </div>
                  </div>
                  <Badge className={getPriorityColor(rec.priority)}>
                    {rec.priority.toUpperCase()} PRIORITY
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3 text-xs">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>Expected Impact: {rec.expectedImpact}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{rec.timeframe}</span>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-xs">
                    <span>Implementation Progress</span>
                    <span className="font-medium">{rec.expectedImpact}%</span>
                  </div>
                  <Progress value={rec.expectedImpact} className="h-2" />
                </div>

                <div className="grid grid-cols-4 gap-2 text-xs mb-3">
                  <div className="text-center">
                    <Car className="w-4 h-4 mx-auto mb-1" />
                    <div>{rec.resourcesNeeded.patrol_cars} Cars</div>
                  </div>
                  <div className="text-center">
                    <Bike className="w-4 h-4 mx-auto mb-1" />
                    <div>{rec.resourcesNeeded.motorcycles} Bikes</div>
                  </div>
                  <div className="text-center">
                    <Users className="w-4 h-4 mx-auto mb-1" />
                    <div>{rec.resourcesNeeded.foot_patrols} Foot</div>
                  </div>
                  <div className="text-center">
                    <Shield className="w-4 h-4 mx-auto mb-1" />
                    <div>{rec.resourcesNeeded.special_units} Special</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    Est. Cost: ₹{rec.estimatedCost.toLocaleString()}
                  </div>
                  <Button size="sm" variant="outline" className="h-6">
                    Implement
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Route className="w-5 h-5 text-blue-500" />
                <span className="font-medium">Avg Route Efficiency</span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {Math.round(patrolRoutes.reduce((acc, route) => acc + route.efficiency, 0) / patrolRoutes.length || 0)}%
              </div>
              <div className="text-xs text-muted-foreground">Across all active routes</div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-green-500" />
                <span className="font-medium">Available Units</span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {resources.filter(r => r.status === 'available').length}
              </div>
              <div className="text-xs text-muted-foreground">Ready for deployment</div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-purple-500" />
                <span className="font-medium">Coverage Score</span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {Math.round((patrolRoutes.filter(r => r.status === 'active').length / patrolRoutes.length) * 100)}%
              </div>
              <div className="text-xs text-muted-foreground">District coverage</div>
            </Card>
          </div>

          <div className="text-center py-8">
            <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h4 className="font-medium text-foreground mb-2">Optimization Complete</h4>
            <p className="text-sm text-muted-foreground">
              Resource allocation has been optimized based on current crime patterns and available units
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
