import { formatCLP } from "@/lib/formatters";
import type { BudgetProgress } from "@/lib/types";

function progressColor(percentUsed: number): string {
  if (percentUsed >= 90) return "bg-red-500";
  if (percentUsed >= 70) return "bg-amber-500";
  return "bg-emerald-500";
}

export function BudgetSection({ items, monthLabel }: { items: BudgetProgress[]; monthLabel: string }) {
  if (items.length === 0) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold tracking-tight">Presupuesto del mes</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          No hay presupuestos configurados para {monthLabel}.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-lg font-semibold tracking-tight">Presupuesto del mes</h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{monthLabel}</p>

      <div className="mt-5 space-y-4">
        {items.map((item) => (
          <div key={item.budgetId}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <span aria-hidden="true">{item.categoryIcon}</span>
                <span>{item.categoryName}</span>
              </div>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {formatCLP(item.spentAmount)} / {formatCLP(item.budgetAmount)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
              <div
                className={`h-full rounded-full ${progressColor(item.percentUsed)}`}
                style={{ width: `${Math.min(item.percentUsed, 100)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {item.percentUsed.toFixed(0)}% usado
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
