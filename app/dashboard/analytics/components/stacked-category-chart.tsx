"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCLP } from "@/lib/formatters";
import type { StackedCategorySeries, StackedMonthPoint } from "@/lib/types";

type StackedCategoryChartProps = {
  series: StackedCategorySeries[];
  points: StackedMonthPoint[];
};

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <p className="mb-2 font-medium">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {formatCLP(entry.value ?? 0)}
        </p>
      ))}
    </div>
  );
}

export function StackedCategoryChart({ series, points }: StackedCategoryChartProps) {
  if (points.every((point) => point.total === 0)) {
    return (
      <div className="flex h-80 items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
        No hay gastos por categoría en el rango seleccionado.
      </div>
    );
  }

  const chartData = points.map((point) => {
    const row: Record<string, string | number | boolean> = {
      label: point.label,
      isCurrent: point.isCurrent,
    };
    for (const item of series) {
      row[item.categoryId] = point.segments[item.categoryId] ?? 0;
    }
    return row;
  });

  return (
    <div className="h-80 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={(props) => {
              const { x, y, payload } = props;
              const isCurrent = chartData.find((row) => row.label === payload.value)?.isCurrent;
              return (
                <text
                  x={x}
                  y={y}
                  dy={16}
                  textAnchor="middle"
                  fill={isCurrent ? "#18181b" : "#71717a"}
                  fontSize={12}
                  fontWeight={isCurrent ? 700 : 400}
                >
                  {payload.value}
                </text>
              );
            }}
          />
          <YAxis tickFormatter={(value) => formatCLP(Number(value))} width={90} tick={{ fontSize: 11 }} />
          <Tooltip content={<ChartTooltip />} />
          <Legend />
          {series.map((item) => (
            <Bar
              key={item.categoryId}
              dataKey={item.categoryId}
              name={item.name}
              stackId="categories"
              fill={item.color}
            >
              {chartData.map((row, index) => (
                <Cell
                  key={`${item.categoryId}-${index}`}
                  fill={item.color}
                  opacity={row.isCurrent ? 1 : 0.75}
                />
              ))}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
