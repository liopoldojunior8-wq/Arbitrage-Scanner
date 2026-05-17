import { pgTable, serial, integer, real, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const alertsTable = pgTable("alerts", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  productName: text("product_name").notNull(),
  marketplace: text("marketplace").notNull(),
  targetPrice: real("target_price").notNull(),
  currentPrice: real("current_price"),
  condition: text("condition").notNull().default("below"),
  channels: text("channels").array().notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
  triggeredAt: timestamp("triggered_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAlertSchema = createInsertSchema(alertsTable).omit({ id: true, createdAt: true });
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alertsTable.$inferSelect;
