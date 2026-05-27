import {
  addMonths,
  endOfMonth,
  format,
  startOfMonth,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import { calcChangePercent } from "@/lib/formatters";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Account,
  BudgetPageItem,
  BudgetProgress,
  Category,
  CategoryExpense,
  CategoryInput,
  CsvTransactionRow,
  DashboardMetrics,
  ImportCsvInput,
  MetricWithChange,
  MonthlyIncomeExpense,
  TransactionFilters,
  TransactionInput,
  TransactionSource,
  TransactionType,
  TransactionWithRelations,
} from "@/lib/types";

type TransactionRow = {
  amount: number;
  type: string;
  date: string;
  account_id: string | null;
};

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return typeof value === "number" ? value : Number(value);
}

function buildMetric(current: number, previous: number): MetricWithChange {
  return {
    current,
    previous,
    changePercent: calcChangePercent(current, previous),
  };
}

function sumByType(
  rows: TransactionRow[],
  type: "expense" | "income",
  rangeStart: Date,
  rangeEnd: Date,
): number {
  const start = format(rangeStart, "yyyy-MM-dd");
  const end = format(rangeEnd, "yyyy-MM-dd");

  return rows
    .filter((row) => row.type === type && row.date >= start && row.date <= end)
    .reduce((acc, row) => acc + toNumber(row.amount), 0);
}

async function getAuthenticatedUserId(): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new Error("No hay sesión activa.");
  }

  return data.user.id;
}

function mapTransactionWithRelations(row: {
  id: string;
  user_id: string;
  account_id: string | null;
  category_id: string | null;
  amount: number | string;
  type: string;
  description: string | null;
  date: string;
  source: string;
  created_at: string;
  category: unknown;
  account: unknown;
}): TransactionWithRelations {
  const category = Array.isArray(row.category) ? row.category[0] : row.category;
  const account = Array.isArray(row.account) ? row.account[0] : row.account;

  return {
    id: row.id,
    user_id: row.user_id,
    account_id: row.account_id,
    category_id: row.category_id,
    amount: toNumber(row.amount),
    type: row.type as TransactionType,
    description: row.description,
    date: row.date,
    source: row.source as TransactionSource,
    created_at: row.created_at,
    category: category ?? null,
    account: account ?? null,
  };
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createSupabaseServerClient();
  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from("categories")
    .select("id, user_id, name, color, icon, type")
    .eq("user_id", userId)
    .order("name");

  if (error) throw new Error(error.message);
  return (data ?? []) as Category[];
}

export async function getTransactions(filters: TransactionFilters = {}): Promise<TransactionWithRelations[]> {
  const supabase = await createSupabaseServerClient();
  const userId = await getAuthenticatedUserId();

  let query = supabase
    .from("transactions")
    .select(
      "id, user_id, account_id, category_id, amount, type, description, date, source, created_at, category:categories(id, name, icon, color), account:accounts(id, name)",
    )
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.dateFrom) query = query.gte("date", filters.dateFrom);
  if (filters.dateTo) query = query.lte("date", filters.dateTo);
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.type) query = query.eq("type", filters.type);
  if (filters.accountId) query = query.eq("account_id", filters.accountId);
  if (filters.search) query = query.ilike("description", `%${filters.search}%`);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map(mapTransactionWithRelations);
}

export async function createTransaction(input: TransactionInput): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const userId = await getAuthenticatedUserId();

  const { error } = await supabase.from("transactions").insert({
    user_id: userId,
    account_id: input.accountId,
    category_id: input.categoryId,
    amount: input.amount,
    type: input.type,
    description: input.description || null,
    date: input.date,
    source: "manual",
  });

  if (error) throw new Error(error.message);
}

export async function updateTransaction(id: string, input: TransactionInput): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const userId = await getAuthenticatedUserId();

  const { error } = await supabase
    .from("transactions")
    .update({
      account_id: input.accountId,
      category_id: input.categoryId,
      amount: input.amount,
      type: input.type,
      description: input.description || null,
      date: input.date,
    })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}

export async function deleteTransaction(id: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const userId = await getAuthenticatedUserId();

  const { error } = await supabase.from("transactions").delete().eq("id", id).eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function importCsvTransactions(input: ImportCsvInput): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const userId = await getAuthenticatedUserId();

  if (input.rows.length === 0) return 0;

  const payload = input.rows.map((row: CsvTransactionRow) => ({
    user_id: userId,
    account_id: input.accountId,
    category_id: input.categoryId,
    amount: row.amount,
    type: input.type,
    description: row.description || null,
    date: row.date,
    source: "csv" as const,
  }));

  const { error } = await supabase.from("transactions").insert(payload);
  if (error) throw new Error(error.message);

  return payload.length;
}

export function parseTransactionFilters(params: {
  dateFrom?: string;
  dateTo?: string;
  categoryId?: string;
  type?: string;
  accountId?: string;
  q?: string;
}): TransactionFilters {
  const filters: TransactionFilters = {};

  if (params.dateFrom) filters.dateFrom = params.dateFrom;
  if (params.dateTo) filters.dateTo = params.dateTo;
  if (params.categoryId) filters.categoryId = params.categoryId;
  if (params.accountId) filters.accountId = params.accountId;
  if (params.q) filters.search = params.q;

  if (params.type === "expense" || params.type === "income" || params.type === "investment") {
    filters.type = params.type;
  }

  return filters;
}

export async function getAccounts(): Promise<Account[]> {
  const supabase = await createSupabaseServerClient();
  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from("accounts")
    .select("id, user_id, name, type, balance, currency, created_at")
    .eq("user_id", userId)
    .order("name");

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    ...row,
    balance: toNumber(row.balance),
  }));
}

export async function getDashboardMetrics(accountId?: string): Promise<DashboardMetrics> {
  const supabase = await createSupabaseServerClient();
  const userId = await getAuthenticatedUserId();
  const now = new Date();
  const currentStart = startOfMonth(now);
  const currentEnd = endOfMonth(now);
  const previousStart = startOfMonth(subMonths(now, 1));
  const previousEnd = endOfMonth(subMonths(now, 1));

  const sixMonthsAgo = format(startOfMonth(subMonths(now, 5)), "yyyy-MM-dd");
  const today = format(now, "yyyy-MM-dd");

  let transactionsQuery = supabase
    .from("transactions")
    .select("amount, type, date, account_id")
    .eq("user_id", userId)
    .gte("date", sixMonthsAgo)
    .lte("date", today);

  if (accountId) {
    transactionsQuery = transactionsQuery.eq("account_id", accountId);
  }

  const { data: transactionRows, error: transactionsError } = await transactionsQuery;
  if (transactionsError) throw new Error(transactionsError.message);

  const rows = (transactionRows ?? []) as TransactionRow[];

  const currentExpenses = sumByType(rows, "expense", currentStart, currentEnd);
  const previousExpenses = sumByType(rows, "expense", previousStart, previousEnd);
  const currentIncome = sumByType(rows, "income", currentStart, currentEnd);
  const previousIncome = sumByType(rows, "income", previousStart, previousEnd);

  const currentSavings = currentIncome - currentExpenses;
  const previousSavings = previousIncome - previousExpenses;

  let totalBalance = 0;
  let previousTotalBalance = 0;

  if (accountId) {
    const { data: accountRow, error: accountError } = await supabase
      .from("accounts")
      .select("balance")
      .eq("user_id", userId)
      .eq("id", accountId)
      .maybeSingle();

    if (accountError) throw new Error(accountError.message);
    totalBalance = toNumber(accountRow?.balance);

    const monthDelta = currentSavings;
    previousTotalBalance = totalBalance - monthDelta;
  } else {
    const { data: accountRows, error: accountsError } = await supabase
      .from("accounts")
      .select("balance")
      .eq("user_id", userId);

    if (accountsError) throw new Error(accountsError.message);

    totalBalance = (accountRows ?? []).reduce((acc, row) => acc + toNumber(row.balance), 0);
    previousTotalBalance = totalBalance - currentSavings;
  }

  return {
    totalBalance: buildMetric(totalBalance, previousTotalBalance),
    monthlyExpenses: buildMetric(currentExpenses, previousExpenses),
    monthlyIncome: buildMetric(currentIncome, previousIncome),
    monthlySavings: buildMetric(currentSavings, previousSavings),
  };
}

export async function getMonthlyIncomeExpense(
  accountId?: string,
  months = 6,
): Promise<MonthlyIncomeExpense[]> {
  const supabase = await createSupabaseServerClient();
  const userId = await getAuthenticatedUserId();
  const now = new Date();
  const rangeStart = format(startOfMonth(subMonths(now, months - 1)), "yyyy-MM-dd");
  const rangeEnd = format(now, "yyyy-MM-dd");

  let query = supabase
    .from("transactions")
    .select("amount, type, date, account_id")
    .eq("user_id", userId)
    .in("type", ["expense", "income"])
    .gte("date", rangeStart)
    .lte("date", rangeEnd);

  if (accountId) {
    query = query.eq("account_id", accountId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as TransactionRow[];
  const buckets: MonthlyIncomeExpense[] = [];

  for (let i = months - 1; i >= 0; i -= 1) {
    const monthDate = startOfMonth(subMonths(now, i));
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const monthKey = format(monthDate, "yyyy-MM");

    buckets.push({
      month: monthKey,
      label: format(monthDate, "MMM yy", { locale: es }),
      income: sumByType(rows, "income", monthStart, monthEnd),
      expense: sumByType(rows, "expense", monthStart, monthEnd),
    });
  }

  return buckets;
}

export async function getTopCategoryExpenses(
  accountId?: string,
  limit = 5,
): Promise<CategoryExpense[]> {
  const supabase = await createSupabaseServerClient();
  const userId = await getAuthenticatedUserId();
  const now = new Date();
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");

  let query = supabase
    .from("transactions")
    .select("amount, category_id, category:categories(id, name, icon, color)")
    .eq("user_id", userId)
    .eq("type", "expense")
    .gte("date", monthStart)
    .lte("date", monthEnd);

  if (accountId) {
    query = query.eq("account_id", accountId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const totals = new Map<string, CategoryExpense>();

  for (const row of data ?? []) {
    const category = Array.isArray(row.category) ? row.category[0] : row.category;
    if (!category || !row.category_id) continue;

    const existing = totals.get(row.category_id);
    const amount = toNumber(row.amount);

    if (existing) {
      existing.amount += amount;
    } else {
      totals.set(row.category_id, {
        categoryId: row.category_id,
        name: category.name,
        icon: category.icon,
        color: category.color,
        amount,
      });
    }
  }

  return Array.from(totals.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

export async function getBudgetProgress(accountId?: string): Promise<BudgetProgress[]> {
  const now = new Date();
  const items = await getBudgetPageData(now.getMonth() + 1, now.getFullYear(), accountId);

  return items
    .filter((item) => item.budgetId !== null && item.budgetAmount > 0)
    .map((item) => ({
      budgetId: item.budgetId!,
      categoryId: item.categoryId,
      categoryName: item.categoryName,
      categoryIcon: item.categoryIcon,
      categoryColor: item.categoryColor,
      budgetAmount: item.budgetAmount,
      spentAmount: item.spentAmount,
      percentUsed: item.percentUsed,
    }))
    .sort((a, b) => b.percentUsed - a.percentUsed);
}

export async function getBudgetPageData(
  month: number,
  year: number,
  accountId?: string,
): Promise<BudgetPageItem[]> {
  const supabase = await createSupabaseServerClient();
  const userId = await getAuthenticatedUserId();

  const monthDate = new Date(year, month - 1, 1);
  const monthStart = format(startOfMonth(monthDate), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(monthDate), "yyyy-MM-dd");

  const [categoriesResult, budgetsResult, transactionsResult] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, icon, color")
      .eq("user_id", userId)
      .eq("type", "expense")
      .order("name"),
    supabase
      .from("budgets")
      .select("id, category_id, amount")
      .eq("user_id", userId)
      .eq("month", month)
      .eq("year", year),
    (() => {
      let query = supabase
        .from("transactions")
        .select("amount, category_id, account_id")
        .eq("user_id", userId)
        .eq("type", "expense")
        .gte("date", monthStart)
        .lte("date", monthEnd);

      if (accountId) query = query.eq("account_id", accountId);
      return query;
    })(),
  ]);

  if (categoriesResult.error) throw new Error(categoriesResult.error.message);
  if (budgetsResult.error) throw new Error(budgetsResult.error.message);
  if (transactionsResult.error) throw new Error(transactionsResult.error.message);

  const budgetByCategory = new Map<string, { id: string; amount: number }>();
  for (const budget of budgetsResult.data ?? []) {
    budgetByCategory.set(budget.category_id, {
      id: budget.id,
      amount: toNumber(budget.amount),
    });
  }

  const spentByCategory = new Map<string, number>();
  for (const tx of transactionsResult.data ?? []) {
    if (!tx.category_id) continue;
    const current = spentByCategory.get(tx.category_id) ?? 0;
    spentByCategory.set(tx.category_id, current + toNumber(tx.amount));
  }

  return (categoriesResult.data ?? []).map((category) => {
    const budget = budgetByCategory.get(category.id);
    const budgetAmount = budget?.amount ?? 0;
    const spentAmount = spentByCategory.get(category.id) ?? 0;
    const percentUsed =
      budgetAmount === 0 ? (spentAmount > 0 ? 100 : 0) : (spentAmount / budgetAmount) * 100;

    return {
      categoryId: category.id,
      categoryName: category.name,
      categoryIcon: category.icon,
      categoryColor: category.color,
      budgetId: budget?.id ?? null,
      budgetAmount,
      spentAmount,
      percentUsed,
      difference: budgetAmount - spentAmount,
    };
  });
}

export async function upsertBudgetAmount(
  categoryId: string,
  month: number,
  year: number,
  amount: number,
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const userId = await getAuthenticatedUserId();

  if (amount <= 0) {
    const { error } = await supabase
      .from("budgets")
      .delete()
      .eq("user_id", userId)
      .eq("category_id", categoryId)
      .eq("month", month)
      .eq("year", year);

    if (error) throw new Error(error.message);
    return;
  }

  const { data: existing, error: existingError } = await supabase
    .from("budgets")
    .select("id")
    .eq("user_id", userId)
    .eq("category_id", categoryId)
    .eq("month", month)
    .eq("year", year)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);

  if (existing) {
    const { error } = await supabase
      .from("budgets")
      .update({ amount })
      .eq("id", existing.id)
      .eq("user_id", userId);

    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await supabase.from("budgets").insert({
    user_id: userId,
    category_id: categoryId,
    amount,
    month,
    year,
  });

  if (error) throw new Error(error.message);
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const supabase = await createSupabaseServerClient();
  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from("categories")
    .insert({
      user_id: userId,
      name: input.name,
      color: input.color,
      icon: input.icon,
      type: input.type,
    })
    .select("id, user_id, name, color, icon, type")
    .single();

  if (error) throw new Error(error.message);
  return data as Category;
}

export function parseBudgetPeriod(params: { month?: string; year?: string }): { month: number; year: number } {
  const now = new Date();
  const month = params.month ? Number(params.month) : now.getMonth() + 1;
  const year = params.year ? Number(params.year) : now.getFullYear();

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  }
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return { month, year: now.getFullYear() };
  }

  return { month, year };
}

export function getBudgetPeriodLabel(month: number, year: number): string {
  const date = new Date(year, month - 1, 1);
  return format(date, "MMMM yyyy", { locale: es });
}

export async function getRecentTransactions(
  accountId?: string,
  limit = 5,
): Promise<TransactionWithRelations[]> {
  const supabase = await createSupabaseServerClient();
  const userId = await getAuthenticatedUserId();

  let query = supabase
    .from("transactions")
    .select(
      "id, user_id, account_id, category_id, amount, type, description, date, source, created_at, category:categories(id, name, icon, color), account:accounts(id, name)",
    )
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (accountId) {
    query = query.eq("account_id", accountId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map(mapTransactionWithRelations);
}

export async function getDashboardData(accountId?: string) {
  const [accounts, metrics, monthlyData, topCategories, budgetProgress, recentTransactions] =
    await Promise.all([
      getAccounts(),
      getDashboardMetrics(accountId),
      getMonthlyIncomeExpense(accountId),
      getTopCategoryExpenses(accountId),
      getBudgetProgress(accountId),
      getRecentTransactions(accountId),
    ]);

  return {
    accounts,
    metrics,
    monthlyData,
    topCategories,
    budgetProgress,
    recentTransactions,
  };
}

export function getMonthLabel(date = new Date()): string {
  return format(date, "MMMM yyyy", { locale: es });
}

export function getPreviousMonthLabel(date = new Date()): string {
  return format(addMonths(startOfMonth(date), -1), "MMMM yyyy", { locale: es });
}
