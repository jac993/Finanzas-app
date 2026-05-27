"use client";

import { useState, useTransition } from "react";
import { createCategoryAction } from "../actions";

type AddCategoryModalProps = {
  onClose: () => void;
  onSuccess: () => void;
};

const ICON_OPTIONS = ["📦", "🍔", "🚗", "🏠", "💊", "🎬", "👕", "📚", "✈️", "🛒"];

export function AddCategoryModal({ onClose, onSuccess }: AddCategoryModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await createCategoryAction(formData);
      if (!result.success) {
        setError(result.message ?? "No se pudo crear la categoría.");
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
            <h2 className="text-lg font-semibold tracking-tight">Nueva categoría</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Crea una categoría de gasto para asignarle presupuesto.
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
          <input type="hidden" name="type" value="expense" />

          <label className="block space-y-1 text-sm">
            <span className="font-medium">Nombre</span>
            <input
              name="name"
              type="text"
              required
              placeholder="Ej: Alimentación"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span className="font-medium">Color</span>
            <input
              name="color"
              type="color"
              defaultValue="#888780"
              className="h-10 w-full cursor-pointer rounded-lg border border-zinc-300 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span className="font-medium">Ícono</span>
            <select
              name="icon"
              defaultValue="📦"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            >
              {ICON_OPTIONS.map((icon) => (
                <option key={icon} value={icon}>
                  {icon}
                </option>
              ))}
            </select>
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
              {isPending ? "Creando..." : "Crear categoría"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
