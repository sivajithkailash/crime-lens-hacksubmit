import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CrimeStatsCard } from "@/components/crime-stats-card";
import { CrimeTrendChart } from "@/components/crime-trend-chart";
import { DistrictFilter } from "@/components/district-filter";
import { AlertsPanel } from "@/components/alerts-panel";
import { FIRRedirectPanel } from "@/components/fir-redirect-panel";
import { ChennaiCrimeMap } from "@/components/chennai-crime-map";
import { RealTimeCrimeFeed } from "@/components/real-time-crime-feed";
import { PredictiveHotspotAnalysis } from "@/components/predictive-hotspot-analysis";
import { ResourceAllocationOptimizer } from "@/components/resource-allocation-optimizer";
import { SocialMediaAnalysis } from "@/components/social-media-analysis";
import { AdvancedReporting } from "@/components/advanced-reporting";
import { RefreshCw, Download, MapPin, Eye, Filter, Activity, Brain, Route, Twitter, FileText, LogOut, User } from "lucide-react";
import type { DashboardData } from "@shared/schema";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("last30days");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [activeView, setActiveView] = useState<string>("overview");
  const [mapViewMode, setMapViewMode] = useState<string>("markers"); // "markers" or "heatmap"

  // Main dashboard data query
  const { 
    data: dashboardData, 
    isLoading, 
    refetch 
  } = useQuery<DashboardData>({
    queryKey: ["/api/mongodb/dashboard"],
  });

  // Unified districts query for consistent filtering
  const { data: unifiedDistricts, isLoading: isLoadingDistricts } = useQuery({
    queryKey: ["/api/mongodb/districts"],
    queryFn: async () => {
      const response = await fetch('/api/mongodb/districts');
      if (!response.ok) throw new Error('Failed to fetch districts');
      return response.json();
    }
  });

  const handleRefresh = () => {
    refetch();
  };

  const handleExport = () => {
    // Mock export functionality
    console.log("Exporting crime data report...");
  };

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories(prev => [...prev, categoryId]);
    } else {
      setSelectedCategories(prev => prev.filter(id => id !== categoryId));
    }
  };

  if (isLoading || isLoadingDistricts) {
    return (
      <div className="flex h-screen bg-background">
        <div className="w-80 bg-card border-r border-border p-6">
          <Skeleton className="h-8 w-full mb-4" />
          <Skeleton className="h-32 w-full mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="h-16 w-full mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Unable to Load Dashboard Data
          </h2>
          <p className="text-muted-foreground mb-4">
            There was an error loading the crime analytics dashboard.
          </p>
          <Button onClick={handleRefresh} data-testid="button-retry">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  const filteredCrimeStats = dashboardData.crimeStats.filter(stat =>
    selectedCategories.length === 0 || selectedCategories.includes(stat.category.id)
  );

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-80 bg-card border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-purple rounded-lg flex items-center justify-center">
              <Eye className="text-primary-foreground text-lg" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground" data-testid="text-app-title">
                CRIME LENS
              </h1>
              <p className="text-sm text-muted-foreground" data-testid="text-app-subtitle">
                CHENNAI ANALYTICS 2024
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Real-time crime analytics dashboard for Chennai Metropolitan Police
          </p>
        </div>

        {/* Filters */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* District Filter */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary" />
                MAP FILTERS
              </h3>
              <DistrictFilter
                districts={unifiedDistricts || dashboardData.districts}
                selectedDistrict={selectedDistrict}
                onDistrictChange={setSelectedDistrict}
              />
            </div>

            {/* Crime Categories */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">
                CRIME CATEGORIES
              </h3>
              <div className="space-y-2">
                {dashboardData.crimeStats.map((stat) => (
                  <label key={stat.category.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={selectedCategories.includes(stat.category.id)}
                      onCheckedChange={(checked) => 
                        handleCategoryChange(stat.category.id, checked as boolean)
                      }
                      data-testid={`checkbox-category-${stat.category.id}`}
                    />
                    <span className="text-muted-foreground">{stat.category.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Severity Filter */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">
                SEVERITY FILTER
              </h3>
              <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                <SelectTrigger data-testid="select-severity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="high">High Severity</SelectItem>
                  <SelectItem value="medium">Medium Severity</SelectItem>
                  <SelectItem value="low">Low Severity</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Time Period */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">
                TIME PERIOD
              </h3>
              <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <SelectTrigger data-testid="select-timeframe">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last30days">Last 30 Days</SelectItem>
                  <SelectItem value="last90days">Last 90 Days</SelectItem>
                  <SelectItem value="last6months">Last 6 Months</SelectItem>
                  <SelectItem value="lastyear">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Export Section */}
        <div className="p-6 border-t border-border">
          <Button 
            className="w-full mb-4" 
            variant="secondary"
            onClick={handleExport}
            data-testid="button-export"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <div className="text-xs text-muted-foreground">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 bg-primary rounded-full"></div>
              <span>High Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-accent rounded-full"></div>
              <span>Medium Priority</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {/* Top Bar */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground" data-testid="text-dashboard-title">
                Chennai Crime Dashboard
              </h2>
              <p className="text-sm text-muted-foreground">
                All Chennai Districts • Real-time Analytics
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse-slow"></div>
                <span className="text-muted-foreground">Live Data</span>
              </div>
              <Button onClick={handleRefresh} data-testid="button-refresh">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="h-full overflow-y-auto p-6">
          <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
            <TabsList className="grid w-full grid-cols-6 mb-6">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="live-feed" className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Live Feed
              </TabsTrigger>
              <TabsTrigger value="predictions" className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                AI Predictions
              </TabsTrigger>
              <TabsTrigger value="resources" className="flex items-center gap-2">
                <Route className="w-4 h-4" />
                Resources
              </TabsTrigger>
              <TabsTrigger value="social" className="flex items-center gap-2">
                <Twitter className="w-4 h-4" />
                Social Media
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Reports
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              {/* Crime Stats Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {filteredCrimeStats.map((stat) => (
                  <CrimeStatsCard key={stat.category.id} crimeStats={stat} />
                ))}
              </div>

              {/* Detailed Analytics */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Crime Map */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-foreground">
                      Crime Hotspots by District
                    </h3>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant={mapViewMode === "heatmap" ? "default" : "ghost"}
                        className="text-xs"
                        onClick={() => setMapViewMode("heatmap")}
                      >
                        Heatmap
                      </Button>
                      <Button 
                        size="sm" 
                        variant={mapViewMode === "markers" ? "default" : "ghost"}
                        className="text-xs"
                        onClick={() => setMapViewMode("markers")}
                      >
                        Markers
                      </Button>
                    </div>
                  </div>

                  {/* Chennai Crime Map */}
                  <div className="mb-4">
                  <ChennaiCrimeMap 
                    crimeStats={filteredCrimeStats}
                    districts={unifiedDistricts || dashboardData.districts}
                    selectedDistrict={selectedDistrict}
                    selectedSeverity={selectedSeverity}
                    selectedCategories={selectedCategories}
                    mapViewMode={mapViewMode}
                    className="h-80 w-full rounded-lg"
                  />
                  </div>

                  {/* Heatmap Legend */}
                  {mapViewMode === "heatmap" && (
                    <div className="mb-4 p-3 bg-muted rounded-lg">
                      <h4 className="text-sm font-semibold text-foreground mb-2">Crime Intensity Scale</h4>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-blue-500 rounded"></div>
                          <span>Low</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-green-500 rounded"></div>
                          <span>Low-Med</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                          <span>Medium</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-orange-500 rounded"></div>
                          <span>High</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-red-500 rounded"></div>
                          <span>Very High</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground" data-testid="text-total-incidents">
                        {dashboardData.totalIncidents.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Incidents</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-accent" data-testid="text-clearance-rate">
                        {dashboardData.clearanceRate}%
                      </div>
                      <div className="text-sm text-muted-foreground">Case Clearance Rate</div>
                    </div>
                  </div>
                </Card>

                {/* Trend Analysis */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-foreground">Crime Trends Analysis</h3>
                    <Select defaultValue="last12months">
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="last12months">Last 12 Months</SelectItem>
                        <SelectItem value="last6months">Last 6 Months</SelectItem>
                        <SelectItem value="last3months">Last 3 Months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="h-80 mb-4">
                    <CrimeTrendChart crimeStats={filteredCrimeStats} />
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-primary">March</div>
                      <div className="text-xs text-muted-foreground">Peak Month</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-accent">August</div>
                      <div className="text-xs text-muted-foreground">Lowest Month</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-foreground">47.2</div>
                      <div className="text-xs text-muted-foreground">Daily Average</div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Alerts and Insights */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <AlertsPanel alerts={dashboardData.alerts} />
                <FIRRedirectPanel />
              </div>
            </TabsContent>

            <TabsContent value="live-feed">
              <RealTimeCrimeFeed className="w-full" />
            </TabsContent>

            <TabsContent value="predictions">
              <PredictiveHotspotAnalysis className="w-full" />
            </TabsContent>

            <TabsContent value="resources">
              <ResourceAllocationOptimizer className="w-full" />
            </TabsContent>

            <TabsContent value="social">
              <SocialMediaAnalysis className="w-full" />
            </TabsContent>

            <TabsContent value="reports">
              <AdvancedReporting className="w-full" />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
