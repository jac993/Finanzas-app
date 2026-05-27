import { Suspense } from "react";
import { getAccounts, getCategories, getTransactions, parseTransactionFilters } from "@/lib/queries";
import { TransactionsView } from "./components/transactions-view";

type TransactionsPageProps = {
  searchParams: Promise<{
    dateFrom?: string;
    dateTo?: string;
    categoryId?: string;
    type?: string;
    accountId?: string;
    q?: string;
  }>;
};

function TransactionsFallback() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
      Cargando transacciones...
    </div>
  );
}

export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  const params = await searchParams;
  const filters = parseTransactionFilters(params);

  const [transactions, accounts, categories] = await Promise.all([
    getTransactions(filters),
    getAccounts(),
    getCategories(),
  ]);

  const initialFilters = {
    dateFrom: params.dateFrom ?? "",
    dateTo: params.dateTo ?? "",
    categoryId: params.categoryId ?? "",
    type: params.type ?? "",
    accountId: params.accountId ?? "",
    q: params.q ?? "",
  };

  return (
    <Suspense fallback={<TransactionsFallback />}>
      <TransactionsView
        transactions={transactions}
        accounts={accounts}
        categories={categories}
        initialFilters={initialFilters}
      />
    </Suspense>
  );
}
