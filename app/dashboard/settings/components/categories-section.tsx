"use client";

import { useState, useTransition } from "react";
import {
  CATEGORY_ICON_OPTIONS,
  CATEGORY_TYPE_OPTIONS,
  categoryTypeLabel,
} from "@/lib/category-constants";
import type { Category } from "@/lib/types";
import {
  createCategorySettingsAction,
  deleteCategoryAction,
  insertDefaultCategoriesAction,
  updateCategoryAction,
} from "../actions";

type CategoryModalProps = {
  category?: Category;
  onClose: () => void;
  onSuccess: () => void;
};

function CategoryModal({ category, onClose, onSuccess }: CategoryModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(category);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = isEdit
        ? await updateCategoryAction(category!.id, formData)
        : await createCategorySettingsAction(formData);

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
            {isEdit ? "Editar categoría" : "Nueva categoría"}
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
              defaultValue={category?.name ?? ""}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Tipo</span>
            <select
              name="type"
              defaultValue={category?.type ?? "expense"}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            >
              {CATEGORY_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Color</span>
            <input
              name="color"
              type="color"
              defaultValue={category?.color ?? "#888780"}
              className="h-10 w-full cursor-pointer rounded-lg border border-zinc-300 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Ícono</span>
            <select
              name="icon"
              defaultValue={category?.icon ?? "📦"}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            >
              {CATEGORY_ICON_OPTIONS.map((icon) => (
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

export function CategoriesSection({
  categories,
  onChanged,
}: {
  categories: Category[];
  onChanged: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [defaultMessage, setDefaultMessage] = useState<string | null>(null);

  function handleDelete(category: Category) {
    if (!window.confirm(`¿Eliminar la categoría "${category.name}"?`)) return;

    startTransition(async () => {
      const result = await deleteCategoryAction(category.id);
      if (!result.success) {
        window.alert(result.message ?? "No se pudo eliminar la categoría.");
        return;
      }
      onChanged();
    });
  }

  function handleInsertDefaults() {
    setDefaultMessage(null);
    startTransition(async () => {
      const result = await insertDefaultCategoriesAction();
      setDefaultMessage(result.message ?? (result.success ? "Listo." : "Error."));
      if (result.success) onChanged();
    });
  }

  function handleSuccess() {
    setShowModal(false);
    setEditingCategory(null);
    onChanged();
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Categorías</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Personaliza íconos, colores y tipos de categoría.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          + Agregar
        </button>
      </div>

      {categories.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">No tienes categorías registradas.</p>
      ) : (
        <ul className="mt-4 divide-y divide-zinc-200 dark:divide-zinc-800">
          {categories.map((category) => (
            <li key={category.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
                  style={{ backgroundColor: `${category.color}22` }}
                >
                  {category.icon}
                </span>
                <div>
                  <p className="font-medium">{category.name}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{categoryTypeLabel(category.type)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(category)}
                  className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(category)}
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

      <div className="mt-6 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <h3 className="text-sm font-semibold">Categorías por defecto</h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Inserta un set inicial (Alimentación, Transporte, Salud, Entretenimiento, etc.) sin duplicar las existentes.
        </p>
        <button
          type="button"
          onClick={handleInsertDefaults}
          disabled={isPending}
          className="mt-4 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-800 dark:hover:bg-zinc-900"
        >
          {isPending ? "Insertando..." : "Insertar categorías predeterminadas"}
        </button>
        {defaultMessage ? <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{defaultMessage}</p> : null}
      </div>

      {showModal ? <CategoryModal onClose={() => setShowModal(false)} onSuccess={handleSuccess} /> : null}
      {editingCategory ? (
        <CategoryModal category={editingCategory} onClose={() => setEditingCategory(null)} onSuccess={handleSuccess} />
      ) : null}
    </section>
  );
}
