"use server";

import { eq, and, gte, lt } from "drizzle-orm";
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

export const getExpenseById = async (id: string): Promise<SelectExpense | undefined> => {
  try {
    const expense = await db.query.expensesTable.findFirst({
      where: eq(expensesTable.id, id)
    });
    return expense;
  } catch (error) {
    console.error("Error getting expense by ID:", error);
    throw new Error("Failed to get expense");
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

export const getExpensesByMonth = async (year: number, month: number): Promise<SelectExpense[]> => {
  try {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 1);

    return db.query.expensesTable.findMany({
      where: and(
        gte(expensesTable.date, startDate),
        lt(expensesTable.date, endDate)
      ),
      orderBy: (expenses, { desc }) => [desc(expenses.date)]
    });
  } catch (error) {
    console.error("Error getting expenses by month:", error);
    throw new Error("Failed to get expenses by month");
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

export const bulkInsertExpenses = async (expenses: InsertExpense[]): Promise<SelectExpense[]> => {
  try {
    if (expenses.length === 0) return [];
    const inserted = await db.insert(expensesTable).values(expenses).returning();
    return inserted;
  } catch (error) {
    console.error("Error bulk inserting expenses:", error);
    throw new Error("Failed to bulk insert expenses");
  }
};

export const deleteAllExpenses = async (): Promise<void> => {
  try {
    await db.delete(expensesTable);
  } catch (error) {
    console.error("Error deleting all expenses:", error);
    throw new Error("Failed to delete all expenses");
  }
};
