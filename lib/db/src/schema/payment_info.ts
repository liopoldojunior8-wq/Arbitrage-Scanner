import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const paymentInfoTable = pgTable("payment_info", {
  id: serial("id").primaryKey(),
  accountHolderName: text("account_holder_name").notNull().default(""),
  paypalEmail: text("paypal_email").notNull().default(""),
  mpesaNumber: text("mpesa_number").notNull().default(""),
  bankName: text("bank_name").notNull().default(""),
  bankAccountNumber: text("bank_account_number").notNull().default(""),
  bankRoutingNumber: text("bank_routing_number").notNull().default(""),
  bankSwiftCode: text("bank_swift_code").notNull().default(""),
  paymentInstructions: text("payment_instructions").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPaymentInfoSchema = createInsertSchema(paymentInfoTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const selectPaymentInfoSchema = createSelectSchema(paymentInfoTable);

export type InsertPaymentInfo = z.infer<typeof insertPaymentInfoSchema>;
export type PaymentInfo = typeof paymentInfoTable.$inferSelect;
