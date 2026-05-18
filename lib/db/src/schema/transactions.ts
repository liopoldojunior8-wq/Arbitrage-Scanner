import { pgTable, serial, text, real, integer, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { plansTable } from "./plans";

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id),
  userName: text("user_name").notNull().default(""),
  userEmail: text("user_email").notNull().default(""),
  amount: real("amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  method: text("method").notNull(), // paypal | mpesa | bank
  status: text("status").notNull().default("pending"), // pending | confirmed | rejected
  planId: integer("plan_id").references(() => plansTable.id),
  planName: text("plan_name").notNull().default(""),
  reference: text("reference").notNull().default(""),
  notes: text("notes").notNull().default(""),
  confirmedAt: timestamp("confirmed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Transaction = typeof transactionsTable.$inferSelect;
export type InsertTransaction = typeof transactionsTable.$inferInsert;
