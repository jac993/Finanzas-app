"use client";

import { useState, useTransition } from "react";
import { formatCLP, formatPercent } from "@/lib/formatters";
import { investmentTypeLabel } from "@/lib/investment-constants";
import type { InvestmentListItem } from "@/lib/types";
import { updateInvestmentAmountAction } from "../actions";

type EditInvestmentModalProps = {
  investment: InvestmentListItem;
  onClose: () => void;
  onSuccess: () => void;
};

export function EditInvestmentModal({ investment, onClose, onSuccess }: EditInvestmentModalProps) {
  const [currentAmount, setCurrentAmount] = useState(String(investment.currentAmount));
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const amount = Number(currentAmount);

    startTransition(async () => {
      const result = await updateInvestmentAmountAction(investment.id, amount);
      if (!result.success) {
        setError(result.message ?? "No se pudo actualizar.");
        return;
      }
      onSuccess();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Actualizar inversión</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{investment.name}</p>
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
          <div className="rounded-xl border border-zinc-200 p-3 text-sm dark:border-zinc-800">
            <p className="text-zinc-500 dark:text-zinc-400">Monto inicial</p>
            <p className="font-medium">{formatCLP(investment.initialAmount)}</p>
          </div>

          <label className="block space-y-1 text-sm">
            <span className="font-medium">Monto actual</span>
            <input
              type="number"
              min="0"
              step="1"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
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
              {isPending ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type InvestmentsListProps = {
  items: InvestmentListItem[];
  onEdit: (item: InvestmentListItem) => void;
};

export function InvestmentsList({ items, onEdit }: InvestmentsListProps) {
  if (items.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center shadow-sm dark:border-zinc-700 dark:bg-zinc-950">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Aún no tienes inversiones registradas. Agrega la primera con el botón superior.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      {items.map((item) => (
        <article
          key={item.id}
          className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold tracking-tight">{item.name}</h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {investmentTypeLabel(item.type)} · {item.currency}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="inline-flex items-center justify-center rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
            >
              Editar
            </button>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Monto inicial</p>
              <p className="font-medium">{formatCLP(item.initialAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Monto actual</p>
              <p className="font-medium">{formatCLP(item.currentAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Rentabilidad</p>
              <p
                className={[
                  "font-semibold",
                  item.returnPercent >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
                ].join(" ")}
              >
                {formatPercent(item.returnPercent)}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <span>Progreso de crecimiento</span>
              <span>
                {item.totalReturn >= 0 ? "+" : ""}
                {formatCLP(item.totalReturn)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
              <div
                className={[
                  "h-full rounded-full transition-all",
                  item.returnPercent >= 0 ? "bg-emerald-500" : "bg-red-500",
                ].join(" ")}
                style={{ width: `${item.growthProgress}%` }}
              />
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
