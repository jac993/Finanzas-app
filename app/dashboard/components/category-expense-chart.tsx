"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCLP } from "@/lib/formatters";
import type { CategoryExpense } from "@/lib/types";

function CategoryTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: CategoryExpense & { label: string } }>;
}) {
  if (!active || !payload?.length || !payload[0].payload) return null;

  const item = payload[0].payload;
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <p className="font-medium">
        {item.icon} {item.name}
      </p>
      <p className="mt-1">{formatCLP(item.amount)}</p>
    </div>
  );
}

export function CategoryExpenseChart({ data }: { data: CategoryExpense[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
        No hay gastos por categoría en el mes actual.
      </div>
    );
  }

  const chartData = data.map((item) => ({
    ...item,
    label: `${item.icon} ${item.name}`,
  }));

  return (
    <div className="h-72 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tickFormatter={(value) => formatCLP(Number(value))} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="label" width={120} tick={{ fontSize: 12 }} />
          <Tooltip content={<CategoryTooltip />} />
          <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
            {chartData.map((entry) => (
              <Cell key={entry.categoryId} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
