import { pgTable, serial, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const marketplacesTable = pgTable("marketplaces", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url"),
  isActive: boolean("is_active").notNull().default(true),
  productCount: integer("product_count").notNull().default(0),
  country: text("country").notNull().default("US"),
  currency: text("currency").notNull().default("USD"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMarketplaceSchema = createInsertSchema(marketplacesTable).omit({ id: true, createdAt: true });
export type InsertMarketplace = z.infer<typeof insertMarketplaceSchema>;
export type Marketplace = typeof marketplacesTable.$inferSelect;
