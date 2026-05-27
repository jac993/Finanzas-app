import { Suspense } from "react";
import { AccountFilter } from "./components/account-filter";
import { BudgetSection } from "./components/budget-section";
import { CategoryExpenseChart } from "./components/category-expense-chart";
import { IncomeExpenseChart } from "./components/income-expense-chart";
import { MetricsGrid } from "./components/metrics-grid";
import { RecentTransactionsList } from "./components/recent-transactions-list";
import { getDashboardData, getMonthLabel } from "@/lib/queries";

type DashboardPageProps = {
  searchParams: Promise<{ accountId?: string }>;
};

function AccountFilterFallback() {
  return <div className="h-9 w-full max-w-md animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const accountId = params.accountId;

  const { accounts, metrics, monthlyData, topCategories, budgetProgress, recentTransactions } =
    await getDashboardData(accountId);

  const monthLabel = getMonthLabel();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Resumen financiero de {monthLabel}
        </p>
      </div>

      <Suspense fallback={<AccountFilterFallback />}>
        <AccountFilter accounts={accounts} />
      </Suspense>

      <MetricsGrid metrics={metrics} />

      <div className="grid gap-6 xl:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-semibold tracking-tight">Ingresos vs gastos (6 meses)</h2>
          <IncomeExpenseChart data={monthlyData} />
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold tracking-tight">Top 5 gastos por categoría</h2>
          <CategoryExpenseChart data={topCategories} />
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <BudgetSection items={budgetProgress} monthLabel={monthLabel} />
        <RecentTransactionsList transactions={recentTransactions} />
      </div>
    </div>
  );
}
