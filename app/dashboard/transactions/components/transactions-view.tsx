"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { Account, Category, TransactionType, TransactionWithRelations } from "@/lib/types";
import { ImportCsvModal } from "./import-csv-modal";
import { TransactionModal } from "./transaction-modal";
import { TransactionsTable } from "./transactions-table";
import { TRANSACTION_TYPE_OPTIONS } from "../utils";

type TransactionsViewProps = {
  transactions: TransactionWithRelations[];
  accounts: Account[];
  categories: Category[];
  initialFilters: {
    dateFrom: string;
    dateTo: string;
    categoryId: string;
    type: string;
    accountId: string;
    q: string;
  };
};

export function TransactionsView({
  transactions,
  accounts,
  categories,
  initialFilters,
}: TransactionsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [filters, setFilters] = useState(initialFilters);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithRelations | null>(null);

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  function applyFilters(nextFilters: typeof filters) {
    setFilters(nextFilters);
    const params = new URLSearchParams();

    if (nextFilters.dateFrom) params.set("dateFrom", nextFilters.dateFrom);
    if (nextFilters.dateTo) params.set("dateTo", nextFilters.dateTo);
    if (nextFilters.categoryId) params.set("categoryId", nextFilters.categoryId);
    if (nextFilters.type) params.set("type", nextFilters.type);
    if (nextFilters.accountId) params.set("accountId", nextFilters.accountId);
    if (nextFilters.q) params.set("q", nextFilters.q);

    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `/dashboard/transactions?${query}` : "/dashboard/transactions");
    });
  }

  function clearFilters() {
    applyFilters({
      dateFrom: "",
      dateTo: "",
      categoryId: "",
      type: "",
      accountId: "",
      q: "",
    });
  }

  function handleMutationComplete() {
    setShowCreateModal(false);
    setEditingTransaction(null);
    setShowImportModal(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transacciones</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Administra tus movimientos, filtros e importación CSV.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
          >
            Importar CSV
          </button>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            + Agregar
          </button>
        </div>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Desde</span>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Hasta</span>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Categoría</span>
            <select
              value={filters.categoryId}
              onChange={(e) => setFilters((prev) => ({ ...prev, categoryId: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            >
              <option value="">Todas</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Tipo</span>
            <select
              value={filters.type}
              onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            >
              <option value="">Todos</option>
              {TRANSACTION_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Cuenta</span>
            <select
              value={filters.accountId}
              onChange={(e) => setFilters((prev) => ({ ...prev, accountId: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            >
              <option value="">Todas</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Búsqueda</span>
            <input
              type="search"
              placeholder="Buscar por descripción..."
              value={filters.q}
              onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyFilters(filters)}
            disabled={isPending}
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {isPending ? "Filtrando..." : "Aplicar filtros"}
          </button>
          <button
            type="button"
            onClick={clearFilters}
            disabled={isPending}
            className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
          >
            Limpiar
          </button>
        </div>
      </section>

      {isPending ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
          Cargando transacciones...
        </div>
      ) : (
        <TransactionsTable
          transactions={transactions}
          onEdit={setEditingTransaction}
          onDeleted={handleMutationComplete}
        />
      )}

      {showCreateModal ? (
        <TransactionModal
          mode="create"
          accounts={accounts}
          categories={categories}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleMutationComplete}
        />
      ) : null}

      {editingTransaction ? (
        <TransactionModal
          mode="edit"
          transaction={editingTransaction}
          accounts={accounts}
          categories={categories}
          onClose={() => setEditingTransaction(null)}
          onSuccess={handleMutationComplete}
        />
      ) : null}

      {showImportModal ? (
        <ImportCsvModal
          accounts={accounts}
          categories={categories}
          onClose={() => setShowImportModal(false)}
          onSuccess={handleMutationComplete}
        />
      ) : null}
    </div>
  );
}
