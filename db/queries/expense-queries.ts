"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db/db";
import { InsertExpense, SelectExpense, expensesTable } from "../schema/expense-schema";

export const createExpense = async (data: InsertExpense): Promise<SelectExpense> => {
  try {
    const [newExpense] = await db.insert(expensesTable).values(data).returning();
    return newExpense;
  } catch (error) {
    console.error("Error creating expense:", error);
    throw new Error("Failed to create expense");
  }
};

export const getAllExpenses = async (): Promise<SelectExpense[]> => {
  try {
    return db.query.expensesTable.findMany({
      orderBy: (expenses, { desc }) => [desc(expenses.date)]
    });
  } catch (error) {
    console.error("Error getting all expenses:", error);
    throw new Error("Failed to get expenses");
  }
};

export const deleteExpense = async (id: string): Promise<void> => {
  try {
    await db.delete(expensesTable).where(eq(expensesTable.id, id));
  } catch (error) {
    console.error("Error deleting expense:", error);
    throw new Error("Failed to delete expense");
  }
};
