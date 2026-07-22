import type { DashboardData, CrimeStats } from "@shared/schema";

// This file contains mock data generation utilities for development and testing
// In production, this would be replaced with actual API calls

export const generateMockCrimeData = (): DashboardData => {
  const crimeCategories = [
    { id: "theft", name: "THEFT", icon: "fas fa-user-secret", color: "hsl(280, 100%, 70%)" },
    { id: "burglary", name: "BURGLARY", icon: "fas fa-home", color: "hsl(170, 70%, 50%)" },
    { id: "robbery", name: "ROBBERY", icon: "fas fa-mask", color: "hsl(0, 72%, 51%)" },
    { id: "violence", name: "VIOLENCE", icon: "fas fa-fist-raised", color: "hsl(45, 93%, 58%)" },
    { id: "drugs", name: "DRUG CRIMES", icon: "fas fa-pills", color: "hsl(260, 100%, 60%)" },
  ];

  const districts = [
    { id: "central", name: "Central Chennai", region: "Central", population: 645000 },
    { id: "north", name: "North Chennai", region: "North", population: 890000 },
    { id: "south", name: "South Chennai", region: "South", population: 1200000 },
    { id: "tambaram", name: "Tambaram", region: "South", population: 420000 },
    { id: "avadi", name: "Avadi", region: "North", population: 380000 },
  ];

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];

  const crimeStats: CrimeStats[] = [
    {
      category: crimeCategories[0],
      incidents: [],
      totalCount: 8247,
      changePercent: 12.3,
      hotspots: ["T.Nagar", "Kodambakkam", "Anna Nagar"],
      monthlyData: months.map(month => ({ month, count: 700 + Math.floor(Math.random() * 300) })),
    },
    {
      category: crimeCategories[1],
      incidents: [],
      totalCount: 3156,
      changePercent: -8.7,
      hotspots: ["Anna Nagar", "Velachery", "Adyar"],
      monthlyData: months.map(month => ({ month, count: 250 + Math.floor(Math.random() * 100) })),
    },
    {
      category: crimeCategories[2],
      incidents: [],
      totalCount: 1923,
      changePercent: 5.4,
      hotspots: ["Egmore", "Mylapore", "Central"],
      monthlyData: months.map(month => ({ month, count: 150 + Math.floor(Math.random() * 80) })),
    },
    {
      category: crimeCategories[3],
      incidents: [],
      totalCount: 2087,
      changePercent: -15.2,
      hotspots: ["Washermenpet", "Purasawalkam", "Royapuram"],
      monthlyData: months.map(month => ({ month, count: 170 + Math.floor(Math.random() * 60) })),
    },
    {
      category: crimeCategories[4],
      incidents: [],
      totalCount: 1456,
      changePercent: 23.1,
      hotspots: ["Royapuram", "Tondiarpet", "North Chennai"],
      monthlyData: months.map(month => ({ month, count: 120 + Math.floor(Math.random() * 40) })),
    },
  ];

  const alerts = [
    {
      id: "alert-1",
      title: "High Crime Probability - T.Nagar",
      description: "AI prediction indicates 85% chance of theft incidents in next 4 hours based on historical patterns and current events.",
      districtId: "central",
      priority: "high" as const,
      isActive: true,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: "alert-2",
      title: "Unusual Activity - Anna Nagar",
      description: "Social media sentiment analysis shows increased mentions of suspicious activity in residential areas.",
      districtId: "central",
      priority: "medium" as const,
      isActive: true,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    },
  ];

  const insights = [
    {
      id: "insight-1",
      title: "Pattern Recognition",
      description: "Theft incidents show 67% correlation with local festival dates and increased foot traffic in commercial areas.",
      type: "pattern" as const,
      confidence: "67.00",
      createdAt: new Date(),
    },
    {
      id: "insight-2",
      title: "Predictive Model",
      description: "Next week's crime forecast: 15% decrease in overall incidents due to increased police deployment.",
      type: "prediction" as const,
      confidence: "82.00",
      createdAt: new Date(),
    },
    {
      id: "insight-3",
      title: "Resource Optimization",
      description: "Recommended patrol allocation: 40% Central, 25% South, 20% North, 15% Other districts.",
      type: "optimization" as const,
      confidence: "91.00",
      createdAt: new Date(),
    },
  ];

  const totalIncidents = crimeStats.reduce((sum, stat) => sum + stat.totalCount, 0);

  return {
    totalIncidents,
    clearanceRate: 73.2,
    crimeStats,
    alerts,
    insights,
    districts,
  };
};
