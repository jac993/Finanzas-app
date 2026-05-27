"use client";

import { format } from "date-fns";
import { useState, useTransition } from "react";
import type { Account, Category, TransactionWithRelations } from "@/lib/types";
import { createTransactionAction, updateTransactionAction } from "../actions";
import { TRANSACTION_TYPE_OPTIONS } from "../utils";

type TransactionModalProps = {
  mode: "create" | "edit";
  accounts: Account[];
  categories: Category[];
  transaction?: TransactionWithRelations;
  onClose: () => void;
  onSuccess: () => void;
};

export function TransactionModal({
  mode,
  accounts,
  categories,
  transaction,
  onClose,
  onSuccess,
}: TransactionModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const defaultDate = transaction?.date ?? format(new Date(), "yyyy-MM-dd");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createTransactionAction(formData)
          : await updateTransactionAction(transaction!.id, formData);

      if (!result.success) {
        setError(result.message ?? "Ocurrió un error.");
        return;
      }

      onSuccess();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              {mode === "create" ? "Nueva transacción" : "Editar transacción"}
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Completa los campos para registrar el movimiento.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Tipo</span>
            <select
              name="type"
              defaultValue={transaction?.type ?? "expense"}
              required
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            >
              {TRANSACTION_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1 text-sm">
            <span className="font-medium">Monto</span>
            <input
              name="amount"
              type="number"
              min="1"
              step="1"
              defaultValue={transaction?.amount ?? ""}
              required
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span className="font-medium">Descripción</span>
            <input
              name="description"
              type="text"
              defaultValue={transaction?.description ?? ""}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span className="font-medium">Categoría</span>
            <select
              name="categoryId"
              defaultValue={transaction?.category_id ?? ""}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            >
              <option value="">Sin categoría</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1 text-sm">
            <span className="font-medium">Cuenta</span>
            <select
              name="accountId"
              defaultValue={transaction?.account_id ?? ""}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            >
              <option value="">Sin cuenta</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1 text-sm">
            <span className="font-medium">Fecha</span>
            <input
              name="date"
              type="date"
              defaultValue={defaultDate}
              required
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              {isPending ? "Guardando..." : mode === "create" ? "Crear" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
