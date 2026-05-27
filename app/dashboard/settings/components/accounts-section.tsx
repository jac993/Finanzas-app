"use client";

import { useState, useTransition } from "react";
import { formatCLP } from "@/lib/formatters";
import { ACCOUNT_TYPE_OPTIONS, accountTypeLabel } from "@/lib/category-constants";
import type { Account } from "@/lib/types";
import { createAccountAction, deleteAccountAction, updateAccountAction } from "../actions";

type AccountModalProps = {
  account?: Account;
  onClose: () => void;
  onSuccess: () => void;
};

function AccountModal({ account, onClose, onSuccess }: AccountModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(account);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = isEdit
        ? await updateAccountAction(account!.id, formData)
        : await createAccountAction(formData);

      if (!result.success) {
        setError(result.message ?? "Ocurrió un error.");
        return;
      }
      onSuccess();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight">
            {isEdit ? "Editar cuenta" : "Nueva cuenta"}
          </h2>
          <button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Nombre</span>
            <input
              name="name"
              type="text"
              required
              defaultValue={account?.name ?? ""}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Tipo</span>
            <select
              name="type"
              defaultValue={account?.type ?? "checking"}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            >
              {ACCOUNT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Saldo</span>
            <input
              name="balance"
              type="number"
              step="1"
              defaultValue={account?.balance ?? 0}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Moneda</span>
            <input
              name="currency"
              type="text"
              defaultValue={account?.currency ?? "CLP"}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
              Cancelar
            </button>
            <button type="submit" disabled={isPending} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200">
              {isPending ? "Guardando..." : isEdit ? "Guardar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AccountsSection({
  accounts,
  onChanged,
}: {
  accounts: Account[];
  onChanged: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  function handleDelete(account: Account) {
    if (!window.confirm(`¿Eliminar la cuenta "${account.name}"?`)) return;

    startTransition(async () => {
      const result = await deleteAccountAction(account.id);
      if (!result.success) {
        window.alert(result.message ?? "No se pudo eliminar la cuenta.");
        return;
      }
      onChanged();
    });
  }

  function handleSuccess() {
    setShowModal(false);
    setEditingAccount(null);
    onChanged();
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Cuentas</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Administra tus cuentas bancarias y efectivo.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          + Agregar
        </button>
      </div>

      {accounts.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">No tienes cuentas registradas.</p>
      ) : (
        <ul className="mt-4 divide-y divide-zinc-200 dark:divide-zinc-800">
          {accounts.map((account) => (
            <li key={account.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{account.name}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {accountTypeLabel(account.type)} · {formatCLP(account.balance)} · {account.currency}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingAccount(account)}
                  className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(account)}
                  disabled={isPending}
                  className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60 dark:border-red-900/60 dark:text-red-300 dark:hover:bg-red-950/40"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showModal ? <AccountModal onClose={() => setShowModal(false)} onSuccess={handleSuccess} /> : null}
      {editingAccount ? (
        <AccountModal account={editingAccount} onClose={() => setEditingAccount(null)} onSuccess={handleSuccess} />
      ) : null}
    </section>
  );
}
