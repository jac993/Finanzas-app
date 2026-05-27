import type { BudgetPageItem } from "@/lib/types";

export function budgetProgressColor(percentUsed: number, budgetAmount: number): string {
  if (budgetAmount <= 0) return "bg-zinc-300 dark:bg-zinc-700";
  if (percentUsed >= 100) return "bg-red-500";
  if (percentUsed >= 70) return "bg-amber-500";
  return "bg-emerald-500";
}

export const MONTH_OPTIONS = [
  { value: 1, label: "Enero" },
  { value: 2, label: "Febrero" },
  { value: 3, label: "Marzo" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Mayo" },
  { value: 6, label: "Junio" },
  { value: 7, label: "Julio" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Septiembre" },
  { value: 10, label: "Octubre" },
  { value: 11, label: "Noviembre" },
  { value: 12, label: "Diciembre" },
];

export function buildYearOptions(baseYear = new Date().getFullYear(), range = 3): number[] {
  const years: number[] = [];
  for (let year = baseYear - range; year <= baseYear + range; year += 1) {
    years.push(year);
  }
  return years;
}

export function sortBudgetItems(items: BudgetPageItem[]): BudgetPageItem[] {
  return [...items].sort((a, b) => {
    if (a.budgetAmount > 0 && b.budgetAmount === 0) return -1;
    if (a.budgetAmount === 0 && b.budgetAmount > 0) return 1;
    return b.percentUsed - a.percentUsed;
  });
}
