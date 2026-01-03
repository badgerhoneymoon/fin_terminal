"use server";

import {
  createExpense,
  deleteExpense,
  getAllExpenses,
  getExpensesByMonth,
  bulkInsertExpenses,
  deleteAllExpenses
} from "@/db/queries/expense-queries";
import { InsertExpense, SelectExpense } from "@/db/schema/expense-schema";
import { revalidatePath } from "next/cache";

export type ActionResult<T> = {
  isSuccess: boolean;
  message: string;
  data?: T;
};

export async function createExpenseAction(data: InsertExpense): Promise<ActionResult<SelectExpense>> {
  try {
    const newExpense = await createExpense(data);
    revalidatePath("/expenses");
    return { isSuccess: true, message: "Expense created successfully", data: newExpense };
  } catch (error) {
    console.error("Error in createExpenseAction:", error);
    return { isSuccess: false, message: "Failed to create expense" };
  }
}

export async function deleteExpenseAction(id: string): Promise<ActionResult<void>> {
  try {
    await deleteExpense(id);
    revalidatePath("/expenses");
    return { isSuccess: true, message: "Expense deleted successfully" };
  } catch (error) {
    console.error("Error in deleteExpenseAction:", error);
    return { isSuccess: false, message: "Failed to delete expense" };
  }
}

export async function getAllExpensesAction(): Promise<ActionResult<SelectExpense[]>> {
  try {
    const expenses = await getAllExpenses();
    return { isSuccess: true, message: "Expenses retrieved successfully", data: expenses };
  } catch (error) {
    console.error("Error in getAllExpensesAction:", error);
    return { isSuccess: false, message: "Failed to get expenses" };
  }
}

export async function getExpensesByMonthAction(year: number, month: number): Promise<ActionResult<SelectExpense[]>> {
  try {
    const expenses = await getExpensesByMonth(year, month);
    return { isSuccess: true, message: "Expenses retrieved successfully", data: expenses };
  } catch (error) {
    console.error("Error in getExpensesByMonthAction:", error);
    return { isSuccess: false, message: "Failed to get expenses" };
  }
}

export async function syncExpensesAction(expenses: InsertExpense[]): Promise<ActionResult<SelectExpense[]>> {
  try {
    // Clear existing and insert all (simple sync strategy)
    await deleteAllExpenses();
    const inserted = await bulkInsertExpenses(expenses);
    revalidatePath("/expenses");
    return { isSuccess: true, message: "Expenses synced successfully", data: inserted };
  } catch (error) {
    console.error("Error in syncExpensesAction:", error);
    return { isSuccess: false, message: "Failed to sync expenses" };
  }
}

export async function importExpensesAction(expenses: InsertExpense[]): Promise<ActionResult<SelectExpense[]>> {
  try {
    const inserted = await bulkInsertExpenses(expenses);
    revalidatePath("/expenses");
    return { isSuccess: true, message: "Expenses imported successfully", data: inserted };
  } catch (error) {
    console.error("Error in importExpensesAction:", error);
    return { isSuccess: false, message: "Failed to import expenses" };
  }
}
