import { formatCLP, formatPercent } from "@/lib/formatters";
import type { InvestmentsSummary } from "@/lib/types";

export function InvestmentsSummaryCards({ summary }: { summary: InvestmentsSummary }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Total invertido</p>
        <p className="mt-2 text-2xl font-semibold tracking-tight">{formatCLP(summary.totalInvested)}</p>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Valor actual: {formatCLP(summary.totalCurrent)}
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Ganancia / pérdida acumulada</p>
        <p
          className={[
            "mt-2 text-2xl font-semibold tracking-tight",
            summary.totalReturn >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
          ].join(" ")}
        >
          {summary.totalReturn >= 0 ? "+" : ""}
          {formatCLP(summary.totalReturn)}
        </p>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          {summary.totalInvested > 0
            ? formatPercent((summary.totalReturn / summary.totalInvested) * 100)
            : "—"}
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Mejor inversión del mes</p>
        <p className="mt-2 text-2xl font-semibold tracking-tight">
          {summary.bestInvestment?.name ?? "Sin datos"}
        </p>
        <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
          {summary.bestInvestment ? formatPercent(summary.bestInvestment.returnPercent) : "—"}
        </p>
      </div>
    </div>
  );
}
