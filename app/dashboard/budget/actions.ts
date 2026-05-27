"use server";

import { revalidatePath } from "next/cache";
import { createCategory, upsertBudgetAmount } from "@/lib/queries";
import type { CategoryType } from "@/lib/types";

export type ActionResult = {
  success: boolean;
  message?: string;
};

export async function updateBudgetAmountAction(
  categoryId: string,
  month: number,
  year: number,
  amount: number,
): Promise<ActionResult> {
  try {
    if (!Number.isFinite(amount) || amount < 0) {
      return { success: false, message: "El monto debe ser un número válido." };
    }

    await upsertBudgetAmount(categoryId, month, year, amount);
    revalidatePath("/dashboard/budget");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "No se pudo actualizar el presupuesto.",
    };
  }
}

export async function createCategoryAction(formData: FormData): Promise<ActionResult> {
  try {
    const name = String(formData.get("name") ?? "").trim();
    const color = String(formData.get("color") ?? "#888780").trim();
    const icon = String(formData.get("icon") ?? "📦").trim();
    const type = String(formData.get("type") ?? "expense");

    if (!name) {
      return { success: false, message: "El nombre es obligatorio." };
    }

    if (type !== "expense" && type !== "income" && type !== "investment") {
      return { success: false, message: "Tipo de categoría inválido." };
    }

    await createCategory({
      name,
      color,
      icon,
      type: type as CategoryType,
    });

    revalidatePath("/dashboard/budget");
    revalidatePath("/dashboard/transactions");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "No se pudo crear la categoría.",
    };
  }
}
