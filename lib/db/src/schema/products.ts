import { pgTable, serial, text, boolean, real, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sku: text("sku").notNull().default(""),
  asin: text("asin"),
  marketplace: text("marketplace").notNull(),
  currentPrice: real("current_price").notNull().default(0),
  targetPrice: real("target_price").notNull(),
  imageUrl: text("image_url").notNull().default(""),
  category: text("category").notNull().default("General"),
  isFavorite: boolean("is_favorite").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  priceChange24h: real("price_change_24h"),
  priceChangePercent: real("price_change_percent"),
  lowestPrice: real("lowest_price"),
  highestPrice: real("highest_price"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
