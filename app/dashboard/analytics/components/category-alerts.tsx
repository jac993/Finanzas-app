import { formatCLP, formatPercent } from "@/lib/formatters";
import type { CategoryAlert } from "@/lib/types";

export function CategoryAlerts({ alerts }: { alerts: CategoryAlert[] }) {
  if (alerts.length === 0) return null;

  return (
    <section className="space-y-3">
      {alerts.map((alert) => (
        <div
          key={alert.categoryId}
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100"
        >
          <p className="font-medium">
            ⚠️ Alerta: {alert.categoryIcon} {alert.categoryName} supera en{" "}
            {formatPercent(alert.deviationPercent)} su promedio de los últimos 3 meses.
          </p>
          <p className="mt-1 text-xs opacity-90">
            Mes actual: {formatCLP(alert.currentAmount)} · Promedio 3 meses:{" "}
            {formatCLP(alert.averageAmount)}
          </p>
        </div>
      ))}
    </section>
  );
}
