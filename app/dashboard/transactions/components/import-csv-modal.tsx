"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import type { Account, Category, CsvTransactionRow, TransactionType } from "@/lib/types";
import { importCsvTransactionsAction } from "../actions";
import {
  buildCsvRows,
  IMPORT_FILE_ACCEPT,
  parseImportFile,
  TRANSACTION_TYPE_OPTIONS,
} from "../utils";

type ImportCsvModalProps = {
  accounts: Account[];
  categories: Category[];
  onClose: () => void;
  onSuccess: () => void;
};

type ColumnMapping = {
  date: string;
  amount: string;
  description: string;
};

export function ImportCsvModal({ accounts, categories, onClose, onSuccess }: ImportCsvModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({ date: "", amount: "", description: "" });
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRows = useMemo(() => rows.slice(0, 5), [rows]);

  const parsedPreview = useMemo(() => {
    if (!mapping.date || !mapping.amount) return { valid: [] as CsvTransactionRow[], skipped: 0 };
    return buildCsvRows(rows, mapping);
  }, [rows, mapping]);

  async function loadFile(file: File) {
    setError(null);
    setInfo(null);

    try {
      const parsed = await parseImportFile(file);
      if (parsed.headers.length === 0 || parsed.rows.length === 0) {
        setError("El archivo no contiene datos válidos para importar.");
        return;
      }

      setHeaders(parsed.headers);
      setRows(parsed.rows);
      setMapping({
        date: parsed.headers[0] ?? "",
        amount: parsed.headers[1] ?? parsed.headers[0] ?? "",
        description: parsed.headers[2] ?? parsed.headers[0] ?? "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo leer el archivo.");
    }
  }

  function handleFileInput(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void loadFile(file);
    event.target.value = "";
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }
  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void loadFile(file);
  }

  function handleConfirmImport() {
    setError(null);
    setInfo(null);

    if (!accountId) {
      setError("Selecciona una cuenta para importar.");
      return;
    }

    const { valid, skipped } = buildCsvRows(rows, mapping);
    if (valid.length === 0) {
      setError("No hay filas válidas con el mapeo actual.");
      return;
    }

    startTransition(async () => {
      const result = await importCsvTransactionsAction({
        accountId,
        categoryId: categoryId || null,
        type,
        rows: valid,
      });

      if (!result.success) {
        setError(result.message ?? "No se pudo importar el CSV.");
        return;
      }

      setInfo(`Importación completada: ${result.imported ?? valid.length} filas. Omitidas: ${skipped}.`);
      onSuccess();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Importar transacciones</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Sube un archivo CSV o Excel del banco, revisa la vista previa y confirma la importación.
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

        <div
          role="button"
          tabIndex={0}
          onClick={openFilePicker}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openFilePicker();
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={[
            "cursor-pointer rounded-xl border border-dashed p-6 text-center transition-colors",
            isDragging
              ? "border-zinc-900 bg-zinc-50 dark:border-zinc-200 dark:bg-zinc-900/40"
              : "border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:border-zinc-500 dark:hover:bg-zinc-900/30",
          ].join(" ")}
        >
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Arrastra tu archivo CSV o Excel aquí
          </p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Formatos: .csv, .xlsx, .xls — o haz clic para seleccionarlo
          </p>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              openFilePicker();
            }}
            className="mt-4 inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
          >
            Seleccionar archivo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={IMPORT_FILE_ACCEPT}
            onChange={handleFileInput}
            className="sr-only"
            aria-label="Seleccionar archivo CSV o Excel"
          />
        </div>
        {headers.length > 0 ? (
          <div className="mt-6 space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <label className="space-y-1 text-sm">
                <span className="font-medium">Columna fecha</span>
                <select
                  value={mapping.date}
                  onChange={(e) => setMapping((prev) => ({ ...prev, date: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
                >
                  {headers.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium">Columna monto</span>
                <select
                  value={mapping.amount}
                  onChange={(e) => setMapping((prev) => ({ ...prev, amount: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
                >
                  {headers.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium">Columna descripción</span>
                <select
                  value={mapping.description}
                  onChange={(e) => setMapping((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
                >
                  {headers.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <label className="space-y-1 text-sm">
                <span className="font-medium">Cuenta destino</span>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
                >
                  <option value="">Selecciona cuenta</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium">Categoría (opcional)</span>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
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
              <label className="space-y-1 text-sm">
                <span className="font-medium">Tipo</span>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as TransactionType)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
                >
                  {TRANSACTION_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div>
              <h3 className="text-sm font-medium">Vista previa (primeras 5 filas)</h3>
              <div className="mt-2 overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                <table className="min-w-full text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-900/40">
                    <tr>
                      {headers.map((header) => (
                        <th key={header} className="px-3 py-2 text-left font-medium">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, index) => (
                      <tr key={index} className="border-t border-zinc-200 dark:border-zinc-800">
                        {headers.map((header) => (
                          <td key={header} className="px-3 py-2">
                            {row[header] ?? ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                Filas válidas detectadas con el mapeo actual: {parsedPreview.valid.length}
              </p>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        ) : null}

        {info ? (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
            {info}
          </div>
        ) : null}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={isPending || rows.length === 0}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {isPending ? "Importando..." : "Confirmar importación"}
          </button>
        </div>
      </div>
    </div>
  );
}
