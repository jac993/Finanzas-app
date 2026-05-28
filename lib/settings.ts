import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEFAULT_CATEGORIES } from "@/lib/category-constants";
import { createCategory, getAccounts, getCategories } from "@/lib/queries";
import { getTelegramLinkStatus } from "@/lib/telegram-link";
import type {
  Account,
  AccountInput,
  AccountType,
  Category,
  CategoryInput,
  CategoryType,
  SettingsPageData,
  UserProfile,
} from "@/lib/types";

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return typeof value === "number" ? value : Number(value);
}

async function getAuthenticatedUserId(): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("No hay sesión activa.");
  return data.user.id;
}

export async function getUserProfile(): Promise<UserProfile> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("No hay sesión activa.");

  const metadata = data.user.user_metadata as { full_name?: string; name?: string } | undefined;
  const name = metadata?.full_name ?? metadata?.name ?? null;

  return {
    email: data.user.email ?? "",
    name,
  };
}

export async function getSettingsPageData(): Promise<SettingsPageData> {
  const [profile, accounts, categories, telegram] = await Promise.all([
    getUserProfile(),
    getAccounts(),
    getCategories(),
    getTelegramLinkStatus(),
  ]);

  return { profile, accounts, categories, telegram };
}

export async function updateUserProfile(name: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({
    data: { full_name: name.trim() },
  });
  if (error) throw new Error(error.message);
}

export async function updateUserPassword(password: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error(error.message);
}

export async function createAccount(input: AccountInput): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const userId = await getAuthenticatedUserId();

  const { error } = await supabase.from("accounts").insert({
    user_id: userId,
    name: input.name,
    type: input.type,
    balance: input.balance,
    currency: input.currency,
  });

  if (error) throw new Error(error.message);
}

export async function updateAccount(id: string, input: AccountInput): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const userId = await getAuthenticatedUserId();

  const { error } = await supabase
    .from("accounts")
    .update({
      name: input.name,
      type: input.type,
      balance: input.balance,
      currency: input.currency,
    })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}

export async function deleteAccount(id: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const userId = await getAuthenticatedUserId();

  const { error } = await supabase.from("accounts").delete().eq("id", id).eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function updateCategory(id: string, input: CategoryInput): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const userId = await getAuthenticatedUserId();

  const { error } = await supabase
    .from("categories")
    .update({
      name: input.name,
      color: input.color,
      icon: input.icon,
      type: input.type,
    })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}

export async function deleteCategory(id: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const userId = await getAuthenticatedUserId();

  const { error } = await supabase.from("categories").delete().eq("id", id).eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function insertDefaultCategories(): Promise<number> {
  const existing = await getCategories();
  const existingKeys = new Set(existing.map((category) => `${category.type}:${category.name.toLowerCase()}`));

  let inserted = 0;
  for (const category of DEFAULT_CATEGORIES) {
    const key = `${category.type}:${category.name.toLowerCase()}`;
    if (existingKeys.has(key)) continue;
    await createCategory(category);
    existingKeys.add(key);
    inserted += 1;
  }

  return inserted;
}

export function parseAccountInput(formData: FormData): AccountInput {
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const balance = Number(formData.get("balance"));
  const currency = String(formData.get("currency") ?? "CLP").trim();

  if (!name) throw new Error("El nombre de la cuenta es obligatorio.");
  if (type !== "checking" && type !== "savings" && type !== "cash" && type !== "credit") {
    throw new Error("Tipo de cuenta inválido.");
  }
  if (!Number.isFinite(balance)) throw new Error("El saldo debe ser un número válido.");

  return {
    name,
    type: type as AccountType,
    balance,
    currency: currency || "CLP",
  };
}

export function parseCategoryInput(formData: FormData): CategoryInput {
  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? "#888780").trim();
  const icon = String(formData.get("icon") ?? "📦").trim();
  const type = String(formData.get("type") ?? "expense");

  if (!name) throw new Error("El nombre de la categoría es obligatorio.");
  if (type !== "expense" && type !== "income" && type !== "investment") {
    throw new Error("Tipo de categoría inválido.");
  }

  return {
    name,
    color,
    icon,
    type: type as CategoryType,
  };
}

export type { Account, Category };
