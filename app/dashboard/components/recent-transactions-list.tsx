import { formatCLP, formatDate } from "@/lib/formatters";
import type { TransactionWithRelations } from "@/lib/types";

function sourceLabel(source: TransactionWithRelations["source"]): string {
  return source === "csv" ? "CSV" : "Manual";
}

function amountClass(type: TransactionWithRelations["type"]): string {
  if (type === "income") return "text-emerald-600 dark:text-emerald-400";
  if (type === "expense") return "text-red-600 dark:text-red-400";
  return "text-zinc-700 dark:text-zinc-300";
}

export function RecentTransactionsList({ transactions }: { transactions: TransactionWithRelations[] }) {
  if (transactions.length === 0) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold tracking-tight">Últimas transacciones</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Aún no hay transacciones registradas.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-lg font-semibold tracking-tight">Últimas transacciones</h2>

      <ul className="mt-5 divide-y divide-zinc-200 dark:divide-zinc-800">
        {transactions.map((tx) => (
          <li key={tx.id} className="flex items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span aria-hidden="true">{tx.category?.icon ?? "📦"}</span>
                <p className="truncate text-sm font-medium">
                  {tx.description || tx.category?.name || "Sin descripción"}
                </p>
              </div>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {formatDate(tx.date)} · {sourceLabel(tx.source)}
                {tx.account?.name ? ` · ${tx.account.name}` : ""}
              </p>
            </div>
            <p className={`shrink-0 text-sm font-semibold ${amountClass(tx.type)}`}>
              {tx.type === "expense" ? "-" : tx.type === "income" ? "+" : ""}
              {formatCLP(tx.amount)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
