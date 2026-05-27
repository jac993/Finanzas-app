"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { AnalyticsData, AnalyticsRange } from "@/lib/types";
import { AnalyticsMetrics } from "./analytics-metrics";
import { CategoryAlerts } from "./category-alerts";
import { CategoryComparisonTable } from "./category-comparison-table";
import { InvestmentsAnalyticsSection } from "./investments-analytics-section";
import { StackedCategoryChart } from "./stacked-category-chart";

const RANGE_OPTIONS: { value: AnalyticsRange; label: string }[] = [
  { value: 3, label: "Últimos 3 meses" },
  { value: 6, label: "Últimos 6 meses" },
  { value: 12, label: "Últimos 12 meses" },
];

export function AnalyticsView({ data }: { data: AnalyticsData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function setRange(range: AnalyticsRange) {
    startTransition(() => {
      router.replace(`/dashboard/analytics?range=${range}`);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Análisis y tendencias</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Explora patrones de gasto, alertas y evolución por categoría.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setRange(option.value)}
              disabled={isPending}
              className={[
                "rounded-full px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-60",
                data.range === option.value
                  ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-950"
                  : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900",
              ].join(" ")}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {isPending ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
          Actualizando análisis...
        </div>
      ) : null}

      <AnalyticsMetrics metrics={data.quickMetrics} />
      <CategoryAlerts alerts={data.alerts} />

      <section>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Gastos apilados por categoría</h2>
        <StackedCategoryChart series={data.stackedChart.series} points={data.stackedChart.points} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Comparativa por categoría</h2>
        <CategoryComparisonTable
          rows={data.comparisonRows}
          monthLabels={data.monthLabels}
          monthTotals={data.monthTotals}
        />
      </section>

      <InvestmentsAnalyticsSection
        investments={data.investments}
        monthlyFlow={data.investmentMonthlyFlow}
      />
    </div>
  );
}
