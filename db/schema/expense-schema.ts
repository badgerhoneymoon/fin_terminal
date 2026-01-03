import { pgTable, text, timestamp, uuid, doublePrecision } from "drizzle-orm/pg-core";

export const expensesTable = pgTable("expenses", {
  id: uuid("id").defaultRandom().primaryKey(),
  categoryId: text("category_id").notNull(),
  amount: doublePrecision("amount").notNull(),
  currency: text("currency").notNull(),
  usdRate: doublePrecision("usd_rate").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date())
});

export type InsertExpense = typeof expensesTable.$inferInsert;
export type SelectExpense = typeof expensesTable.$inferSelect;
