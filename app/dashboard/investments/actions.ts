"use server";

import { revalidatePath } from "next/cache";
import { createInvestment, updateInvestmentCurrentAmount } from "@/lib/investments";
import type { InvestmentType } from "@/lib/types";

export type ActionResult = {
  success: boolean;
  message?: string;
};

const VALID_TYPES: InvestmentType[] = ["fund", "deposit", "currency", "stock", "other"];

export async function createInvestmentAction(formData: FormData): Promise<ActionResult> {
  try {
    const name = String(formData.get("name") ?? "").trim();
    const type = String(formData.get("type") ?? "");
    const initialAmount = Number(formData.get("initialAmount"));
    const currentAmount = Number(formData.get("currentAmount"));
    const currency = String(formData.get("currency") ?? "CLP").trim();
    const startedAtRaw = String(formData.get("startedAt") ?? "").trim();

    if (!name) return { success: false, message: "El nombre es obligatorio." };
    if (!VALID_TYPES.includes(type as InvestmentType)) {
      return { success: false, message: "Tipo de inversión inválido." };
    }
    if (!Number.isFinite(initialAmount) || initialAmount <= 0) {
      return { success: false, message: "El monto inicial debe ser mayor a 0." };
    }
    if (!Number.isFinite(currentAmount) || currentAmount < 0) {
      return { success: false, message: "El monto actual debe ser válido." };
    }

    await createInvestment({
      name,
      type: type as InvestmentType,
      initialAmount,
      currentAmount,
      currency: currency || "CLP",
      startedAt: startedAtRaw || null,
    });

    revalidatePath("/dashboard/investments");
    revalidatePath("/dashboard/analytics");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "No se pudo crear la inversión.",
    };
  }
}

export async function updateInvestmentAmountAction(
  id: string,
  currentAmount: number,
): Promise<ActionResult> {
  try {
    if (!Number.isFinite(currentAmount) || currentAmount < 0) {
      return { success: false, message: "El monto actual debe ser válido." };
    }

    await updateInvestmentCurrentAmount(id, currentAmount);
    revalidatePath("/dashboard/investments");
    revalidatePath("/dashboard/analytics");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "No se pudo actualizar la inversión.",
    };
  }
}
