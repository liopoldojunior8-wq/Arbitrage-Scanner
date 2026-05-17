import { pgTable, serial, text, real, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const opportunitiesTable = pgTable("opportunities", {
  id: serial("id").primaryKey(),
  productId: integer("product_id"),
  productName: text("product_name").notNull(),
  productImage: text("product_image").notNull().default(""),
  sku: text("sku").notNull().default(""),
  buyMarketplace: text("buy_marketplace").notNull(),
  sellMarketplace: text("sell_marketplace").notNull(),
  buyPrice: real("buy_price").notNull(),
  sellPrice: real("sell_price").notNull(),
  grossProfit: real("gross_profit").notNull(),
  netProfit: real("net_profit").notNull(),
  profitPercent: real("profit_percent").notNull(),
  roi: real("roi").notNull(),
  estimatedFees: real("estimated_fees").notNull().default(0),
  estimatedShipping: real("estimated_shipping").notNull().default(0),
  status: text("status").notNull().default("active"),
  category: text("category").notNull().default("General"),
  detectedAt: timestamp("detected_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const insertOpportunitySchema = createInsertSchema(opportunitiesTable).omit({ id: true });
export type InsertOpportunity = z.infer<typeof insertOpportunitySchema>;
export type Opportunity = typeof opportunitiesTable.$inferSelect;
