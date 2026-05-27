import type { CategoryInput } from "@/lib/types";

export const CATEGORY_ICON_OPTIONS = ["📦", "🍔", "🚗", "🏠", "💊", "🎬", "👕", "📚", "✈️", "🛒", "💰", "💼", "📈", "🎁"];

export const DEFAULT_CATEGORIES: CategoryInput[] = [
  { name: "Alimentación", icon: "🍔", color: "#ef4444", type: "expense" },
  { name: "Transporte", icon: "🚗", color: "#3b82f6", type: "expense" },
  { name: "Salud", icon: "💊", color: "#10b981", type: "expense" },
  { name: "Entretenimiento", icon: "🎬", color: "#8b5cf6", type: "expense" },
  { name: "Vivienda", icon: "🏠", color: "#f59e0b", type: "expense" },
  { name: "Educación", icon: "📚", color: "#06b6d4", type: "expense" },
  { name: "Compras", icon: "🛒", color: "#ec4899", type: "expense" },
  { name: "Salario", icon: "💰", color: "#059669", type: "income" },
  { name: "Freelance", icon: "💼", color: "#0891b2", type: "income" },
];

export const ACCOUNT_TYPE_OPTIONS = [
  { value: "checking" as const, label: "Cuenta corriente" },
  { value: "savings" as const, label: "Ahorro" },
  { value: "cash" as const, label: "Efectivo" },
  { value: "credit" as const, label: "Crédito" },
];

export const CATEGORY_TYPE_OPTIONS = [
  { value: "expense" as const, label: "Gasto" },
  { value: "income" as const, label: "Ingreso" },
  { value: "investment" as const, label: "Inversión" },
];

export function accountTypeLabel(type: string): string {
  return ACCOUNT_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}

export function categoryTypeLabel(type: string): string {
  return CATEGORY_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}
