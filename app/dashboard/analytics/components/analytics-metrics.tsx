import { formatCLP, formatPercent } from "@/lib/formatters";
import type { AnalyticsQuickMetrics } from "@/lib/types";

export function AnalyticsMetrics({ metrics }: { metrics: AnalyticsQuickMetrics }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        title="Gasto total del mes"
        value={formatCLP(metrics.totalExpensesCurrentMonth)}
        subtitle="Mes actual"
      />
      <MetricCard
        title="Categoría con mayor gasto"
        value={
          metrics.topCategory
            ? `${metrics.topCategory.icon} ${metrics.topCategory.name}`
            : "Sin datos"
        }
        subtitle={metrics.topCategory ? formatCLP(metrics.topCategory.amount) : "—"}
      />
      <MetricCard
        title="Mayor crecimiento vs mes anterior"
        value={
          metrics.fastestGrowingCategory
            ? `${metrics.fastestGrowingCategory.icon} ${metrics.fastestGrowingCategory.name}`
            : "Sin aumentos"
        }
        subtitle={
          metrics.fastestGrowingCategory
            ? formatPercent(metrics.fastestGrowingCategory.changePercent)
            : "—"
        }
        highlight={Boolean(metrics.fastestGrowingCategory && metrics.fastestGrowingCategory.changePercent > 20)}
      />
      <MetricCard
        title="Ahorro neto del mes"
        value={formatCLP(metrics.netSavings)}
        subtitle={metrics.netSavings >= 0 ? "Superávit" : "Déficit"}
        positive={metrics.netSavings >= 0}
      />
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  highlight = false,
  positive,
}: {
  title: string;
  value: string;
  subtitle: string;
  highlight?: boolean;
  positive?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{title}</p>
      <p className="mt-2 text-lg font-semibold tracking-tight">{value}</p>
      <p
        className={[
          "mt-2 text-xs font-medium",
          highlight ? "text-red-600 dark:text-red-400" : "",
          positive === true ? "text-emerald-600 dark:text-emerald-400" : "",
          positive === false ? "text-red-600 dark:text-red-400" : "",
          highlight || positive !== undefined ? "" : "text-zinc-500 dark:text-zinc-400",
        ].join(" ")}
      >
        {subtitle}
      </p>
    </div>
  );
}
