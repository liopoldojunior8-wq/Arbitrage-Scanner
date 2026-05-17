import { pgTable, serial, integer, real, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const priceHistoryTable = pgTable("price_history", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  price: real("price").notNull(),
  marketplace: text("marketplace").notNull(),
  recordedAt: timestamp("recorded_at").notNull().defaultNow(),
});

export const insertPriceHistorySchema = createInsertSchema(priceHistoryTable).omit({ id: true });
export type InsertPriceHistory = z.infer<typeof insertPriceHistorySchema>;
export type PriceHistory = typeof priceHistoryTable.$inferSelect;
