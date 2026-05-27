"use client";

import { useTransition } from "react";
import { formatCLP, formatDate } from "@/lib/formatters";
import type { TransactionWithRelations } from "@/lib/types";
import { deleteTransactionAction } from "../actions";
import { transactionTypeLabel } from "../utils";

type TransactionsTableProps = {
  transactions: TransactionWithRelations[];
  onEdit: (transaction: TransactionWithRelations) => void;
  onDeleted: () => void;
};

function sourceLabel(source: TransactionWithRelations["source"]): string {
  return source === "csv" ? "CSV" : "Manual";
}

function amountClass(type: TransactionWithRelations["type"]): string {
  if (type === "income") return "text-emerald-600 dark:text-emerald-400";
  if (type === "expense") return "text-red-600 dark:text-red-400";
  return "text-zinc-700 dark:text-zinc-300";
}

export function TransactionsTable({ transactions, onEdit, onDeleted }: TransactionsTableProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete(transaction: TransactionWithRelations) {
    const confirmed = window.confirm("¿Eliminar esta transacción?");
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteTransactionAction(transaction.id);
      if (!result.success) {
        window.alert(result.message ?? "No se pudo eliminar la transacción.");
        return;
      }
      onDeleted();
    });
  }

  if (transactions.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center shadow-sm dark:border-zinc-700 dark:bg-zinc-950">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No hay transacciones con los filtros actuales.
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
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Descripción</th>
              <th className="px-4 py-3 font-medium">Categoría</th>
              <th className="px-4 py-3 font-medium">Cuenta</th>
              <th className="px-4 py-3 font-medium">Monto</th>
              <th className="px-4 py-3 font-medium">Fuente</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                <td className="px-4 py-3 whitespace-nowrap">{formatDate(tx.date)}</td>
                <td className="px-4 py-3">
                  <div className="max-w-xs truncate">{tx.description || "—"}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">{transactionTypeLabel(tx.type)}</div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {tx.category ? `${tx.category.icon} ${tx.category.name}` : "—"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{tx.account?.name ?? "—"}</td>
                <td className={`px-4 py-3 whitespace-nowrap font-medium ${amountClass(tx.type)}`}>
                  {tx.type === "expense" ? "-" : tx.type === "income" ? "+" : ""}
                  {formatCLP(tx.amount)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{sourceLabel(tx.source)}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(tx)}
                      className="rounded-md border border-zinc-200 px-2 py-1 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(tx)}
                      disabled={isPending}
                      className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60 dark:border-red-900/60 dark:text-red-300 dark:hover:bg-red-950/40"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
