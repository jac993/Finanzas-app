"use server";

import { revalidatePath } from "next/cache";
import {
  createTransaction,
  deleteTransaction,
  importCsvTransactions,
  updateTransaction,
} from "@/lib/queries";
import type { ImportCsvInput, TransactionInput } from "@/lib/types";

export type ActionResult = {
  success: boolean;
  message?: string;
};

function parseTransactionInput(formData: FormData): TransactionInput {
  const type = formData.get("type");
  const amount = Number(formData.get("amount"));
  const description = String(formData.get("description") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const accountId = String(formData.get("accountId") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();

  if (type !== "expense" && type !== "income" && type !== "investment") {
    throw new Error("Tipo de transacción inválido.");
  }
  if (!date) throw new Error("La fecha es obligatoria.");
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("El monto debe ser mayor a 0.");

  return {
    type,
    amount,
    description,
    categoryId: categoryId || null,
    accountId: accountId || null,
    date,
  };
}

export async function createTransactionAction(formData: FormData): Promise<ActionResult> {
  try {
    const input = parseTransactionInput(formData);
    await createTransaction(input);
    revalidatePath("/dashboard/transactions");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "No se pudo crear la transacción.",
    };
  }
}

export async function updateTransactionAction(id: string, formData: FormData): Promise<ActionResult> {
  try {
    const input = parseTransactionInput(formData);
    await updateTransaction(id, input);
    revalidatePath("/dashboard/transactions");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "No se pudo actualizar la transacción.",
    };
  }
}

export async function deleteTransactionAction(id: string): Promise<ActionResult> {
  try {
    await deleteTransaction(id);
    revalidatePath("/dashboard/transactions");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "No se pudo eliminar la transacción.",
    };
  }
}

export async function importCsvTransactionsAction(input: ImportCsvInput): Promise<ActionResult & { imported?: number }> {
  try {
    if (!input.accountId) {
      return { success: false, message: "Debes seleccionar una cuenta para importar." };
    }
    if (input.rows.length === 0) {
      return { success: false, message: "No hay filas válidas para importar." };
    }

    const imported = await importCsvTransactions(input);
    revalidatePath("/dashboard/transactions");
    revalidatePath("/dashboard");
    return { success: true, imported };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "No se pudo importar el CSV.",
    };
  }
}