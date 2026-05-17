import { pgTable, serial, text, real, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const plansTable = pgTable("plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  price: real("price").notNull(),
  currency: text("currency").notNull().default("USD"),
  interval: text("interval").notNull().default("month"),
  features: text("features").array().notNull().default([]),
  productLimit: integer("product_limit"),
  alertLimit: integer("alert_limit"),
  isPopular: boolean("is_popular").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPlanSchema = createInsertSchema(plansTable).omit({ id: true, createdAt: true });
export type InsertPlan = z.infer<typeof insertPlanSchema>;
export type Plan = typeof plansTable.$inferSelect;
