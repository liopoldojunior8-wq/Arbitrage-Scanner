import { pgTable, serial, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { plansTable } from "./plans";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull().default(""),
  phone: text("phone").notNull().default(""),
  status: text("status").notNull().default("active"), // active | suspended | pending
  planId: integer("plan_id").references(() => plansTable.id),
  premiumUntil: timestamp("premium_until"),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type User = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;
