import { formatCLP, formatPercent } from "@/lib/formatters";
import type { CategoryComparisonRow } from "@/lib/types";

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length === 0) return null;

  const width = 80;
  const height = 24;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);

  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
    </svg>
  );
}

function TrendBadge({ trend, variationPercent }: { trend: CategoryComparisonRow["trend"]; variationPercent: number }) {
  if (trend === "up") {
    return (
      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
        ↑ {formatPercent(variationPercent)}
      </span>
    );
  }
  if (trend === "down") {
    return (
      <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
        ↓ {formatPercent(variationPercent)}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
      → {formatPercent(variationPercent)}
    </span>
  );
}

export function CategoryComparisonTable({
  rows,
  monthLabels,
  monthTotals,
}: {
  rows: CategoryComparisonRow[];
  monthLabels: string[];
  monthTotals: number[];
}) {
  if (rows.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center shadow-sm dark:border-zinc-700 dark:bg-zinc-950">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No hay datos comparativos por categoría en este rango.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-left dark:border-zinc-800 dark:bg-zinc-900/40">
            <tr>
              <th className="px-4 py-3 font-medium">Categoría</th>
              {monthLabels.map((label) => (
                <th key={label} className="px-4 py-3 font-medium whitespace-nowrap">
                  {label}
                </th>
              ))}
              <th className="px-4 py-3 font-medium">Tendencia</th>
              <th className="px-4 py-3 font-medium">Variación %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {rows.map((row) => (
              <tr key={row.categoryId} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span>{row.icon}</span>
                    <span className="font-medium">{row.name}</span>
                  </div>
                </td>
                {row.monthlyAmounts.map((amount, index) => (
                  <td key={`${row.categoryId}-${index}`} className="px-4 py-3 whitespace-nowrap">
                    {formatCLP(amount)}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <Sparkline values={row.monthlyAmounts} color={row.color} />
                </td>
                <td className="px-4 py-3">
                  <TrendBadge trend={row.trend} variationPercent={row.variationPercent} />
                </td>
              </tr>
            ))}
            <tr className="bg-zinc-50 font-semibold dark:bg-zinc-900/40">
              <td className="px-4 py-3">Totales</td>
              {monthTotals.map((total, index) => (
                <td key={`total-${index}`} className="px-4 py-3 whitespace-nowrap">
                  {formatCLP(total)}
                </td>
              ))}
              <td className="px-4 py-3" colSpan={2} />
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
