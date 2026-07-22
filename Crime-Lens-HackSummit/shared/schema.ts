import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const crimeCategories = pgTable("crime_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
});

export const districts = pgTable("districts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  region: text("region").notNull(),
  population: integer("population").notNull(),
});

export const crimeIncidents = pgTable("crime_incidents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").notNull().references(() => crimeCategories.id),
  districtId: varchar("district_id").notNull().references(() => districts.id),
  count: integer("count").notNull(),
  month: text("month").notNull(),
  year: integer("year").notNull(),
  changePercent: decimal("change_percent", { precision: 5, scale: 2 }),
  hotspots: text("hotspots").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const crimeAlerts = pgTable("crime_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  districtId: varchar("district_id").notNull().references(() => districts.id),
  priority: text("priority").notNull(), // high, medium, low
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const aiInsights = pgTable("ai_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // pattern, prediction, optimization
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertCrimeCategorySchema = createInsertSchema(crimeCategories).omit({
  id: true,
});

export const insertDistrictSchema = createInsertSchema(districts).omit({
  id: true,
});

export const insertCrimeIncidentSchema = createInsertSchema(crimeIncidents).omit({
  id: true,
  createdAt: true,
});

export const insertCrimeAlertSchema = createInsertSchema(crimeAlerts).omit({
  id: true,
  createdAt: true,
});

export const insertAiInsightSchema = createInsertSchema(aiInsights).omit({
  id: true,
  createdAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type CrimeCategory = typeof crimeCategories.$inferSelect;
export type InsertCrimeCategory = z.infer<typeof insertCrimeCategorySchema>;

export type District = typeof districts.$inferSelect;
export type InsertDistrict = z.infer<typeof insertDistrictSchema>;

export type CrimeIncident = typeof crimeIncidents.$inferSelect;
export type InsertCrimeIncident = z.infer<typeof insertCrimeIncidentSchema>;

export type CrimeAlert = typeof crimeAlerts.$inferSelect;
export type InsertCrimeAlert = z.infer<typeof insertCrimeAlertSchema>;

export type AiInsight = typeof aiInsights.$inferSelect;
export type InsertAiInsight = z.infer<typeof insertAiInsightSchema>;

export type CrimeStats = {
  category: CrimeCategory;
  incidents: CrimeIncident[];
  totalCount: number;
  changePercent: number;
  hotspots: string[];
  monthlyData: Array<{ month: string; count: number }>;
};

export type DashboardData = {
  totalIncidents: number;
  clearanceRate: number;
  crimeStats: CrimeStats[];
  alerts: CrimeAlert[];
  insights: AiInsight[];
  districts: District[];
};
