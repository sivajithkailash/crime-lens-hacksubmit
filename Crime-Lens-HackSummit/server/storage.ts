import {
  type User,
  type InsertUser,
  type CrimeCategory,
  type InsertCrimeCategory,
  type District,
  type InsertDistrict,
  type CrimeIncident,
  type InsertCrimeIncident,
  type CrimeAlert,
  type InsertCrimeAlert,
  type AiInsight,
  type InsertAiInsight,
  type CrimeStats,
  type DashboardData,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Crime data methods
  getCrimeCategories(): Promise<CrimeCategory[]>;
  getDistricts(): Promise<District[]>;
  getCrimeIncidents(categoryId?: string, districtId?: string): Promise<CrimeIncident[]>;
  getCrimeAlerts(isActive?: boolean): Promise<CrimeAlert[]>;
  getAiInsights(): Promise<AiInsight[]>;
  getDashboardData(): Promise<DashboardData>;
  getCrimeStats(): Promise<CrimeStats[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private crimeCategories: Map<string, CrimeCategory>;
  private districts: Map<string, District>;
  private crimeIncidents: Map<string, CrimeIncident>;
  private crimeAlerts: Map<string, CrimeAlert>;
  private aiInsights: Map<string, AiInsight>;

  constructor() {
    this.users = new Map();
    this.crimeCategories = new Map();
    this.districts = new Map();
    this.crimeIncidents = new Map();
    this.crimeAlerts = new Map();
    this.aiInsights = new Map();
    
    this.initializeData();
  }

  private initializeData() {
    // Initialize crime categories
    const categories: CrimeCategory[] = [
      { id: "theft", name: "THEFT", icon: "fas fa-user-secret", color: "hsl(280 100% 70%)" },
      { id: "burglary", name: "BURGLARY", icon: "fas fa-home", color: "hsl(170 70% 50%)" },
      { id: "robbery", name: "ROBBERY", icon: "fas fa-mask", color: "hsl(0 72% 51%)" },
      { id: "violence", name: "VIOLENCE", icon: "fas fa-fist-raised", color: "hsl(45 93% 58%)" },
      { id: "drugs", name: "DRUG CRIMES", icon: "fas fa-pills", color: "hsl(260 100% 60%)" },
    ];
    categories.forEach(cat => this.crimeCategories.set(cat.id, cat));

    // Initialize Chennai districts
    const districts: District[] = [
      { id: "central", name: "Central Chennai", region: "Central", population: 645000 },
      { id: "north", name: "North Chennai", region: "North", population: 890000 },
      { id: "south", name: "South Chennai", region: "South", population: 1200000 },
      { id: "tambaram", name: "Tambaram", region: "South", population: 420000 },
      { id: "avadi", name: "Avadi", region: "North", population: 380000 },
      { id: "anna-nagar", name: "Anna Nagar", region: "Central", population: 250000 },
      { id: "t-nagar", name: "T.Nagar", region: "Central", population: 180000 },
      { id: "velachery", name: "Velachery", region: "South", population: 320000 },
    ];
    districts.forEach(dist => this.districts.set(dist.id, dist));

    // Initialize crime incidents with realistic Chennai data
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
    let incidentId = 0;

    const incidentData = [
      { categoryId: "theft", baseCounts: [720, 680, 890, 780, 650, 600, 580, 520, 640, 750, 680], change: 12.3, hotspots: ["T.Nagar", "Kodambakkam", "Anna Nagar"] },
      { categoryId: "burglary", baseCounts: [280, 260, 320, 290, 250, 240, 220, 200, 260, 280, 250], change: -8.7, hotspots: ["Anna Nagar", "Velachery", "Adyar"] },
      { categoryId: "robbery", baseCounts: [160, 150, 190, 180, 170, 160, 140, 130, 150, 180, 170], change: 5.4, hotspots: ["Egmore", "Mylapore", "Central"] },
      { categoryId: "violence", baseCounts: [180, 170, 210, 200, 180, 160, 150, 140, 160, 190, 180], change: -15.2, hotspots: ["Washermenpet", "Purasawalkam", "Royapuram"] },
      { categoryId: "drugs", baseCounts: [120, 110, 140, 130, 125, 115, 110, 100, 120, 140, 130], change: 23.1, hotspots: ["Royapuram", "Tondiarpet", "North Chennai"] },
    ];

    incidentData.forEach(({ categoryId, baseCounts, change, hotspots }) => {
      months.forEach((month, index) => {
        districts.forEach(district => {
          const baseCount = baseCounts[index];
          // Vary by district population
          const populationFactor = district.population / 500000;
          const count = Math.floor(baseCount * populationFactor * (0.8 + Math.random() * 0.4));
          
          const incident: CrimeIncident = {
            id: `incident-${++incidentId}`,
            categoryId,
            districtId: district.id,
            count,
            month,
            year: 2024,
            changePercent: change.toString(),
            hotspots,
            createdAt: new Date(),
          };
          this.crimeIncidents.set(incident.id, incident);
        });
      });
    });

    // Initialize alerts
    const alerts: CrimeAlert[] = [
      {
        id: "alert-1",
        title: "High Crime Probability - T.Nagar",
        description: "AI prediction indicates 85% chance of theft incidents in next 4 hours based on historical patterns and current events.",
        districtId: "t-nagar",
        priority: "high",
        isActive: true,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        id: "alert-2",
        title: "Unusual Activity - Anna Nagar",
        description: "Social media sentiment analysis shows increased mentions of suspicious activity in residential areas.",
        districtId: "anna-nagar",
        priority: "medium",
        isActive: true,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      },
    ];
    alerts.forEach(alert => this.crimeAlerts.set(alert.id, alert));

    // Initialize AI insights
    const insights: AiInsight[] = [
      {
        id: "insight-1",
        title: "Pattern Recognition",
        description: "Theft incidents show 67% correlation with local festival dates and increased foot traffic in commercial areas.",
        type: "pattern",
        confidence: "67.00",
        createdAt: new Date(),
      },
      {
        id: "insight-2",
        title: "Predictive Model",
        description: "Next week's crime forecast: 15% decrease in overall incidents due to increased police deployment.",
        type: "prediction",
        confidence: "82.00",
        createdAt: new Date(),
      },
      {
        id: "insight-3",
        title: "Resource Optimization",
        description: "Recommended patrol allocation: 40% Central, 25% South, 20% North, 15% Other districts.",
        type: "optimization",
        confidence: "91.00",
        createdAt: new Date(),
      },
    ];
    insights.forEach(insight => this.aiInsights.set(insight.id, insight));
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getCrimeCategories(): Promise<CrimeCategory[]> {
    return Array.from(this.crimeCategories.values());
  }

  async getDistricts(): Promise<District[]> {
    return Array.from(this.districts.values());
  }

  async getCrimeIncidents(categoryId?: string, districtId?: string): Promise<CrimeIncident[]> {
    let incidents = Array.from(this.crimeIncidents.values());
    
    if (categoryId) {
      incidents = incidents.filter(incident => incident.categoryId === categoryId);
    }
    
    if (districtId) {
      incidents = incidents.filter(incident => incident.districtId === districtId);
    }
    
    return incidents;
  }

  async getCrimeAlerts(isActive?: boolean): Promise<CrimeAlert[]> {
    let alerts = Array.from(this.crimeAlerts.values());
    
    if (isActive !== undefined) {
      alerts = alerts.filter(alert => alert.isActive === isActive);
    }
    
    return alerts.sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async getAiInsights(): Promise<AiInsight[]> {
    return Array.from(this.aiInsights.values())
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async getCrimeStats(): Promise<CrimeStats[]> {
    const categories = await this.getCrimeCategories();
    const stats: CrimeStats[] = [];

    for (const category of categories) {
      const incidents = await this.getCrimeIncidents(category.id);
      
      // Calculate total count
      const totalCount = incidents.reduce((sum, incident) => sum + incident.count, 0);
      
      // Calculate change percent (average across all incidents)
      const changePercent = incidents.length > 0 
        ? incidents.reduce((sum, incident) => sum + parseFloat(incident.changePercent || "0"), 0) / incidents.length
        : 0;
      
      // Get hotspots (unique across all incidents)
      const allHotspots = incidents.flatMap(incident => incident.hotspots || []);
      const hotspots = Array.from(new Set(allHotspots)).slice(0, 3); // Top 3 unique hotspots
      
      // Generate monthly data
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
      const monthlyData = months.map(month => {
        const monthIncidents = incidents.filter(incident => incident.month === month);
        const count = monthIncidents.reduce((sum, incident) => sum + incident.count, 0);
        return { month, count };
      });

      stats.push({
        category,
        incidents,
        totalCount,
        changePercent,
        hotspots,
        monthlyData,
      });
    }

    return stats;
  }

  async getDashboardData(): Promise<DashboardData> {
    const [crimeStats, alerts, insights, districts] = await Promise.all([
      this.getCrimeStats(),
      this.getCrimeAlerts(true),
      this.getAiInsights(),
      this.getDistricts(),
    ]);

    const totalIncidents = crimeStats.reduce((sum, stat) => sum + stat.totalCount, 0);
    const clearanceRate = 73.2; // Mock clearance rate

    return {
      totalIncidents,
      clearanceRate,
      crimeStats,
      alerts,
      insights,
      districts,
    };
  }
}

export const storage = new MemStorage();
