"use server";

import { revalidatePath } from "next/cache";
import { createCategory } from "@/lib/queries";
import {
  createAccount,
  deleteAccount,
  deleteCategory,
  insertDefaultCategories,
  parseAccountInput,
  parseCategoryInput,
  updateAccount,
  updateCategory,
  updateUserPassword,
  updateUserProfile,
} from "@/lib/settings";

export type ActionResult = {
  success: boolean;
  message?: string;
  inserted?: number;
};

function revalidateSettingsPaths() {
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/budget");
}

export async function updateProfileAction(formData: FormData): Promise<ActionResult> {
  try {
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return { success: false, message: "El nombre es obligatorio." };

    await updateUserProfile(name);
    revalidateSettingsPaths();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "No se pudo actualizar el perfil.",
    };
  }
}

export async function updatePasswordAction(formData: FormData): Promise<ActionResult> {
  try {
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password.length < 8) {
      return { success: false, message: "La contraseña debe tener al menos 8 caracteres." };
    }
    if (password !== confirmPassword) {
      return { success: false, message: "Las contraseñas no coinciden." };
    }

    await updateUserPassword(password);
    return { success: true, message: "Contraseña actualizada correctamente." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "No se pudo cambiar la contraseña.",
    };
  }
}

export async function createAccountAction(formData: FormData): Promise<ActionResult> {
  try {
    const input = parseAccountInput(formData);
    await createAccount(input);
    revalidateSettingsPaths();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "No se pudo crear la cuenta.",
    };
  }
}

export async function updateAccountAction(id: string, formData: FormData): Promise<ActionResult> {
  try {
    const input = parseAccountInput(formData);
    await updateAccount(id, input);
    revalidateSettingsPaths();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "No se pudo actualizar la cuenta.",
    };
  }
}

export async function deleteAccountAction(id: string): Promise<ActionResult> {
  try {
    await deleteAccount(id);
    revalidateSettingsPaths();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "No se pudo eliminar la cuenta.",
    };
  }
}

export async function createCategorySettingsAction(formData: FormData): Promise<ActionResult> {
  try {
    const input = parseCategoryInput(formData);
    await createCategory(input);
    revalidateSettingsPaths();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "No se pudo crear la categoría.",
    };
  }
}

export async function updateCategoryAction(id: string, formData: FormData): Promise<ActionResult> {
  try {
    const input = parseCategoryInput(formData);
    await updateCategory(id, input);
    revalidateSettingsPaths();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "No se pudo actualizar la categoría.",
    };
  }
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  try {
    await deleteCategory(id);
    revalidateSettingsPaths();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "No se pudo eliminar la categoría.",
    };
  }
}

export async function insertDefaultCategoriesAction(): Promise<ActionResult> {
  try {
    const inserted = await insertDefaultCategories();
    revalidateSettingsPaths();
    return {
      success: true,
      inserted,
      message:
        inserted > 0
          ? `Se agregaron ${inserted} categorías predeterminadas.`
          : "Ya tenías todas las categorías predeterminadas.",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "No se pudieron insertar las categorías.",
    };
  }
}
