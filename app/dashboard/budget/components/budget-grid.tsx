"use client";

import { useEffect, useState, useTransition } from "react";
import { formatCLP } from "@/lib/formatters";
import type { BudgetPageItem } from "@/lib/types";
import { updateBudgetAmountAction } from "../actions";
import { budgetProgressColor } from "../utils";

type BudgetGridProps = {
  items: BudgetPageItem[];
  month: number;
  year: number;
  onUpdated: () => void;
};

function BudgetAmountInput({
  item,
  month,
  year,
  onUpdated,
}: {
  item: BudgetPageItem;
  month: number;
  year: number;
  onUpdated: () => void;
}) {
  const [value, setValue] = useState(String(item.budgetAmount || ""));
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValue(String(item.budgetAmount || ""));
  }, [item.budgetAmount]);

  function saveBudget() {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount < 0) {
      setError("Monto inválido");
      return;
    }

    if (amount === item.budgetAmount) return;

    setError(null);
    startTransition(async () => {
      const result = await updateBudgetAmountAction(item.categoryId, month, year, amount);
      if (!result.success) {
        setError(result.message ?? "Error al guardar");
        return;
      }
      onUpdated();
    });
  }

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Presupuesto</label>
      <div className="flex gap-2">
        <input
          type="number"
          min="0"
          step="1"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={saveBudget}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
          disabled={isPending}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>
      {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}
      {isPending ? <p className="text-xs text-zinc-500">Guardando...</p> : null}
    </div>
  );
}

export function BudgetGrid({ items, month, year, onUpdated }: BudgetGridProps) {
  if (items.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center shadow-sm dark:border-zinc-700 dark:bg-zinc-950">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No hay categorías de gasto. Crea una categoría para empezar a definir presupuestos.
        </p>
      </section>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item) => {
        const isExceeded = item.difference < 0;
        const progressWidth = item.budgetAmount > 0 ? Math.min(item.percentUsed, 100) : 0;

        return (
          <article
            key={item.categoryId}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
                  style={{ backgroundColor: `${item.categoryColor}22` }}
                  aria-hidden="true"
                >
                  {item.categoryIcon}
                </span>
                <div>
                  <h3 className="font-semibold tracking-tight">{item.categoryName}</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Gastado: {formatCLP(item.spentAmount)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <BudgetAmountInput item={item} month={month} year={year} onUpdated={onUpdated} />
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>{item.budgetAmount > 0 ? `${item.percentUsed.toFixed(0)}% usado` : "Sin presupuesto"}</span>
                <span>
                  {item.budgetAmount > 0
                    ? isExceeded
                      ? `Excedido por ${formatCLP(Math.abs(item.difference))}`
                      : `Restante ${formatCLP(item.difference)}`
                    : "—"}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
                <div
                  className={`h-full rounded-full transition-all ${budgetProgressColor(item.percentUsed, item.budgetAmount)}`}
                  style={{ width: `${progressWidth}%` }}
                />
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
