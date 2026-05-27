import {
  endOfMonth,
  format,
  startOfMonth,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import { calcChangePercent } from "@/lib/formatters";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  AnalyticsData,
  AnalyticsQuickMetrics,
  AnalyticsRange,
  CategoryAlert,
  CategoryComparisonRow,
  Investment,
  InvestmentAnalyticsItem,
  StackedCategorySeries,
  StackedMonthPoint,
} from "@/lib/types";

type ExpenseTx = {
  amount: number | string;
  date: string;
  category_id: string | null;
  category: { id: string; name: string; icon: string; color: string } | null;
};

type IncomeExpenseTx = {
  amount: number | string;
  type: string;
  date: string;
};

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return typeof value === "number" ? value : Number(value);
}

async function getAuthenticatedUserId(): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("No hay sesión activa.");
  return data.user.id;
}

function monthKey(date: Date): string {
  return format(date, "yyyy-MM");
}

function monthLabel(date: Date): string {
  return format(date, "MMM yy", { locale: es });
}

function inMonth(dateStr: string, date: Date): boolean {
  const start = format(startOfMonth(date), "yyyy-MM-dd");
  const end = format(endOfMonth(date), "yyyy-MM-dd");
  return dateStr >= start && dateStr <= end;
}

function normalizeCategory(
  raw: unknown,
): { id: string; name: string; icon: string; color: string } | null {
  const category = Array.isArray(raw) ? raw[0] : raw;
  if (!category || typeof category !== "object") return null;
  const c = category as { id: string; name: string; icon: string; color: string };
  return c;
}

export function parseAnalyticsRange(value?: string): AnalyticsRange {
  if (value === "3" || value === "12") return Number(value) as AnalyticsRange;
  return 6;
}

function buildQuickMetrics(
  expenseRows: ExpenseTx[],
  incomeExpenseRows: IncomeExpenseTx[],
  now: Date,
): AnalyticsQuickMetrics {
  const currentStart = startOfMonth(now);
  const previousStart = startOfMonth(subMonths(now, 1));

  const currentExpenses = expenseRows
    .filter((row) => inMonth(row.date, currentStart))
    .reduce((acc, row) => acc + toNumber(row.amount), 0);

  const currentIncome = incomeExpenseRows
    .filter((row) => row.type === "income" && inMonth(row.date, currentStart))
    .reduce((acc, row) => acc + toNumber(row.amount), 0);

  const categoryTotals = new Map<string, { name: string; icon: string; amount: number }>();
  for (const row of expenseRows) {
    if (!inMonth(row.date, currentStart) || !row.category_id || !row.category) continue;
    const current = categoryTotals.get(row.category_id);
    const amount = toNumber(row.amount);
    if (current) {
      current.amount += amount;
    } else {
      categoryTotals.set(row.category_id, {
        name: row.category.name,
        icon: row.category.icon,
        amount,
      });
    }
  }

  let topCategory: AnalyticsQuickMetrics["topCategory"] = null;
  for (const item of categoryTotals.values()) {
    if (!topCategory || item.amount > topCategory.amount) {
      topCategory = item;
    }
  }

  const growthByCategory = new Map<string, { name: string; icon: string; changePercent: number }>();
  for (const row of expenseRows) {
    if (!row.category_id || !row.category) continue;
    const catId = row.category_id;
    if (!growthByCategory.has(catId)) {
      const current = expenseRows
        .filter((item) => item.category_id === catId && inMonth(item.date, currentStart))
        .reduce((acc, item) => acc + toNumber(item.amount), 0);
      const previous = expenseRows
        .filter((item) => item.category_id === catId && inMonth(item.date, previousStart))
        .reduce((acc, item) => acc + toNumber(item.amount), 0);

      growthByCategory.set(catId, {
        name: row.category.name,
        icon: row.category.icon,
        changePercent: calcChangePercent(current, previous),
      });
    }
  }

  let fastestGrowingCategory: AnalyticsQuickMetrics["fastestGrowingCategory"] = null;
  for (const item of growthByCategory.values()) {
    if (item.changePercent <= 0) continue;
    if (!fastestGrowingCategory || item.changePercent > fastestGrowingCategory.changePercent) {
      fastestGrowingCategory = item;
    }
  }

  return {
    totalExpensesCurrentMonth: currentExpenses,
    topCategory,
    fastestGrowingCategory,
    netSavings: currentIncome - currentExpenses,
  };
}

function buildAlerts(expenseRows: ExpenseTx[], now: Date): CategoryAlert[] {
  const alerts: CategoryAlert[] = [];
  const categoryIds = new Set(
    expenseRows.map((row) => row.category_id).filter((id): id is string => Boolean(id)),
  );

  for (const categoryId of categoryIds) {
    const sample = expenseRows.find((row) => row.category_id === categoryId);
    if (!sample?.category) continue;

    const currentAmount = expenseRows
      .filter((row) => row.category_id === categoryId && inMonth(row.date, now))
      .reduce((acc, row) => acc + toNumber(row.amount), 0);

    const previousMonths = [1, 2, 3].map((offset) => subMonths(now, offset));
    const previousAmounts = previousMonths.map((monthDate) =>
      expenseRows
        .filter((row) => row.category_id === categoryId && inMonth(row.date, monthDate))
        .reduce((acc, row) => acc + toNumber(row.amount), 0),
    );

    const averageAmount =
      previousAmounts.reduce((acc, value) => acc + value, 0) / previousAmounts.length;

    if (averageAmount <= 0 || currentAmount <= averageAmount * 1.2) continue;

    const deviationPercent = calcChangePercent(currentAmount, averageAmount);

    alerts.push({
      categoryId,
      categoryName: sample.category.name,
      categoryIcon: sample.category.icon,
      deviationPercent,
      currentAmount,
      averageAmount,
    });
  }

  return alerts.sort((a, b) => b.deviationPercent - a.deviationPercent);
}

function buildStackedChart(
  expenseRows: ExpenseTx[],
  monthDates: Date[],
): { series: StackedCategorySeries[]; points: StackedMonthPoint[] } {
  const totalsByCategory = new Map<string, { name: string; color: string; total: number }>();

  for (const row of expenseRows) {
    if (!row.category_id || !row.category) continue;
    const amount = toNumber(row.amount);
    const existing = totalsByCategory.get(row.category_id);
    if (existing) {
      existing.total += amount;
    } else {
      totalsByCategory.set(row.category_id, {
        name: row.category.name,
        color: row.category.color,
        total: amount,
      });
    }
  }

  const topCategories = Array.from(totalsByCategory.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 8);

  const series: StackedCategorySeries[] = topCategories.map(([categoryId, info]) => ({
    categoryId,
    name: info.name,
    color: info.color,
  }));

  const currentKey = monthKey(monthDates[monthDates.length - 1]!);

  const points: StackedMonthPoint[] = monthDates.map((monthDate) => {
    const key = monthKey(monthDate);
    const segments: Record<string, number> = {};
    let total = 0;

    for (const { categoryId } of series) {
      const amount = expenseRows
        .filter((row) => row.category_id === categoryId && inMonth(row.date, monthDate))
        .reduce((acc, row) => acc + toNumber(row.amount), 0);
      segments[categoryId] = amount;
      total += amount;
    }

    return {
      monthKey: key,
      label: monthLabel(monthDate),
      isCurrent: key === currentKey,
      total,
      segments,
    };
  });

  return { series, points };
}

function buildComparisonRows(
  expenseRows: ExpenseTx[],
  monthDates: Date[],
): CategoryComparisonRow[] {
  const categoryMap = new Map<string, { name: string; icon: string; color: string }>();
  for (const row of expenseRows) {
    if (!row.category_id || !row.category) continue;
    categoryMap.set(row.category_id, {
      name: row.category.name,
      icon: row.category.icon,
      color: row.category.color,
    });
  }

  const labels = monthDates.map(monthLabel);

  const rows: CategoryComparisonRow[] = Array.from(categoryMap.entries()).map(
    ([categoryId, meta]) => {
      const monthlyAmounts = monthDates.map((monthDate) =>
        expenseRows
          .filter((row) => row.category_id === categoryId && inMonth(row.date, monthDate))
          .reduce((acc, row) => acc + toNumber(row.amount), 0),
      );

      const current = monthlyAmounts[monthlyAmounts.length - 1] ?? 0;
      const previous = monthlyAmounts[monthlyAmounts.length - 2] ?? 0;
      const variationPercent = calcChangePercent(current, previous);

      let trend: CategoryComparisonRow["trend"] = "stable";
      if (variationPercent > 5) trend = "up";
      if (variationPercent < -5) trend = "down";

      return {
        categoryId,
        name: meta.name,
        icon: meta.icon,
        color: meta.color,
        monthlyAmounts,
        monthLabels: labels,
        trend,
        variationPercent,
      };
    },
  );

  return rows.sort((a, b) => {
    const totalA = a.monthlyAmounts.reduce((acc, value) => acc + value, 0);
    const totalB = b.monthlyAmounts.reduce((acc, value) => acc + value, 0);
    return totalB - totalA;
  });
}

function buildInvestmentItems(
  investments: Investment[],
  investmentTxCurrent: number,
  investmentTxPrevious: number,
): { items: InvestmentAnalyticsItem[]; monthlyFlow: number } {
  const monthlyFlow = investmentTxCurrent - investmentTxPrevious;
  const totalCurrent = investments.reduce((acc, investment) => acc + toNumber(investment.current_amount), 0);

  const items = investments.map((investment) => {
    const initialAmount = toNumber(investment.initial_amount);
    const currentAmount = toNumber(investment.current_amount);
    const totalReturn = currentAmount - initialAmount;
    const returnPercent = initialAmount === 0 ? 0 : (totalReturn / initialAmount) * 100;
    const monthlyChange =
      totalCurrent === 0 ? 0 : (currentAmount / totalCurrent) * monthlyFlow;

    return {
      id: investment.id,
      name: investment.name,
      type: investment.type,
      initialAmount,
      currentAmount,
      totalReturn,
      returnPercent,
      monthlyChange,
    };
  });

  return { items, monthlyFlow };
}

export async function getAnalyticsData(range: AnalyticsRange): Promise<AnalyticsData> {
  const supabase = await createSupabaseServerClient();
  const userId = await getAuthenticatedUserId();
  const now = new Date();
  const monthDates = Array.from({ length: range }, (_, index) =>
    startOfMonth(subMonths(now, range - 1 - index)),
  );
  const rangeStart = format(monthDates[0]!, "yyyy-MM-dd");
  const rangeEnd = format(endOfMonth(now), "yyyy-MM-dd");

  const [expenseResult, flowResult, investmentsResult] = await Promise.all([
    supabase
      .from("transactions")
      .select("amount, date, category_id, category:categories(id, name, icon, color)")
      .eq("user_id", userId)
      .eq("type", "expense")
      .gte("date", rangeStart)
      .lte("date", rangeEnd),
    supabase
      .from("transactions")
      .select("amount, type, date")
      .eq("user_id", userId)
      .in("type", ["expense", "income", "investment"])
      .gte("date", format(startOfMonth(subMonths(now, range - 1)), "yyyy-MM-dd"))
      .lte("date", rangeEnd),
    supabase
      .from("investments")
      .select("id, user_id, name, type, initial_amount, current_amount, currency, started_at, created_at")
      .eq("user_id", userId)
      .order("name"),
  ]);

  if (expenseResult.error) throw new Error(expenseResult.error.message);
  if (flowResult.error) throw new Error(flowResult.error.message);
  if (investmentsResult.error) throw new Error(investmentsResult.error.message);

  const expenseRows: ExpenseTx[] = (expenseResult.data ?? []).map((row) => ({
    amount: row.amount,
    date: row.date,
    category_id: row.category_id,
    category: normalizeCategory(row.category),
  }));

  const flowRows: IncomeExpenseTx[] = (flowResult.data ?? []).map((row) => ({
    amount: row.amount,
    type: row.type,
    date: row.date,
  }));

  const investments = (investmentsResult.data ?? []) as Investment[];

  const currentMonth = startOfMonth(now);
  const previousMonth = startOfMonth(subMonths(now, 1));

  const investmentTxCurrent = flowRows
    .filter((row) => row.type === "investment" && inMonth(row.date, currentMonth))
    .reduce((acc, row) => acc + toNumber(row.amount), 0);

  const investmentTxPrevious = flowRows
    .filter((row) => row.type === "investment" && inMonth(row.date, previousMonth))
    .reduce((acc, row) => acc + toNumber(row.amount), 0);

  const stackedChart = buildStackedChart(expenseRows, monthDates);
  const comparisonRows = buildComparisonRows(expenseRows, monthDates);
  const monthTotals = monthDates.map((monthDate) =>
    expenseRows
      .filter((row) => inMonth(row.date, monthDate))
      .reduce((acc, row) => acc + toNumber(row.amount), 0),
  );
  const monthLabels = monthDates.map(monthLabel);
  const { items: investmentsItems, monthlyFlow } = buildInvestmentItems(
    investments,
    investmentTxCurrent,
    investmentTxPrevious,
  );

  return {
    range,
    quickMetrics: buildQuickMetrics(expenseRows, flowRows, now),
    alerts: buildAlerts(expenseRows, now),
    stackedChart,
    comparisonRows,
    monthTotals,
    monthLabels,
    investments: investmentsItems,
    investmentMonthlyFlow: monthlyFlow,
  };
}
