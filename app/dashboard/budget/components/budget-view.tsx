"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { BudgetPageItem } from "@/lib/types";
import { AddCategoryModal } from "./add-category-modal";
import { BudgetGrid } from "./budget-grid";
import { buildYearOptions, MONTH_OPTIONS, sortBudgetItems } from "../utils";

type BudgetViewProps = {
  items: BudgetPageItem[];
  month: number;
  year: number;
  periodLabel: string;
};

export function BudgetView({ items, month, year, periodLabel }: BudgetViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedMonth, setSelectedMonth] = useState(month);
  const [selectedYear, setSelectedYear] = useState(year);
  const [showAddCategory, setShowAddCategory] = useState(false);

  useEffect(() => {
    setSelectedMonth(month);
    setSelectedYear(year);
  }, [month, year]);

  const yearOptions = buildYearOptions(new Date().getFullYear());
  const sortedItems = sortBudgetItems(items);

  function applyPeriod(nextMonth: number, nextYear: number) {
    setSelectedMonth(nextMonth);
    setSelectedYear(nextYear);
    startTransition(() => {
      router.replace(`/dashboard/budget?month=${nextMonth}&year=${nextYear}`);
    });
  }

  function handleMutationComplete() {
    setShowAddCategory(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Presupuesto</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Controla tus límites por categoría para {periodLabel}.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddCategory(true)}
          className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          + Nueva categoría
        </button>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Mes</span>
            <select
              value={selectedMonth}
              onChange={(e) => applyPeriod(Number(e.target.value), selectedYear)}
              disabled={isPending}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            >
              {MONTH_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Año</span>
            <select
              value={selectedYear}
              onChange={(e) => applyPeriod(selectedMonth, Number(e.target.value))}
              disabled={isPending}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            >
              {yearOptions.map((optionYear) => (
                <option key={optionYear} value={optionYear}>
                  {optionYear}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {isPending ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
          Cargando presupuesto...
        </div>
      ) : (
        <BudgetGrid items={sortedItems} month={month} year={year} onUpdated={handleMutationComplete} />
      )}

      {showAddCategory ? (
        <AddCategoryModal onClose={() => setShowAddCategory(false)} onSuccess={handleMutationComplete} />
      ) : null}
    </div>
  );
}
