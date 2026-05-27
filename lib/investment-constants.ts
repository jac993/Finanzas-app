import type { InvestmentType } from "@/lib/types";

export const INVESTMENT_TYPE_OPTIONS: { value: InvestmentType; label: string }[] = [
  { value: "fund", label: "Fondo" },
  { value: "deposit", label: "Depósito" },
  { value: "currency", label: "Moneda" },
  { value: "stock", label: "Acción" },
  { value: "other", label: "Otro" },
];

export function investmentTypeLabel(type: InvestmentType): string {
  return INVESTMENT_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}
