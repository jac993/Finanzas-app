import { formatCLP, formatPercent } from "@/lib/formatters";
import type { DashboardMetrics } from "@/lib/types";

type MetricCardProps = {
  title: string;
  metric: DashboardMetrics[keyof DashboardMetrics];
  invertChange?: boolean;
};

function ChangeBadge({
  changePercent,
  invertChange = false,
}: {
  changePercent: number;
  invertChange?: boolean;
}) {
  if (changePercent === 0) {
    return <span className="text-xs text-zinc-500 dark:text-zinc-400">Sin cambio vs mes anterior</span>;
  }

  const isPositive = changePercent > 0;
  const isGood = invertChange ? !isPositive : isPositive;

  return (
    <span
      className={[
        "text-xs font-medium",
        isGood ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
      ].join(" ")}
    >
      {formatPercent(changePercent)} vs mes anterior
    </span>
  );
}

function MetricCard({ title, metric, invertChange = false }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{title}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{formatCLP(metric.current)}</p>
      <div className="mt-2">
        <ChangeBadge changePercent={metric.changePercent} invertChange={invertChange} />
      </div>
    </div>
  );
}

export function MetricsGrid({ metrics }: { metrics: DashboardMetrics }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard title="Saldo total" metric={metrics.totalBalance} />
      <MetricCard title="Gastos del mes" metric={metrics.monthlyExpenses} invertChange />
      <MetricCard title="Ingresos del mes" metric={metrics.monthlyIncome} />
      <MetricCard title="Ahorro del mes" metric={metrics.monthlySavings} />
    </div>
  );
}
