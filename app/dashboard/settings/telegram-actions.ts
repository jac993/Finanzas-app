"use server";

import { revalidatePath } from "next/cache";
import { generateTelegramLinkCode, unlinkTelegram } from "@/lib/telegram-link";

export type TelegramActionResult = {
  success: boolean;
  message?: string;
  code?: string;
};

export async function generateTelegramCodeAction(): Promise<TelegramActionResult> {
  try {
    const code = await generateTelegramLinkCode();
    revalidatePath("/dashboard/settings");
    return { success: true, code };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "No se pudo generar el código.",
    };
  }
}

export async function unlinkTelegramAction(): Promise<TelegramActionResult> {
  try {
    await unlinkTelegram();
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "No se pudo desvincular Telegram.",
    };
  }
}
