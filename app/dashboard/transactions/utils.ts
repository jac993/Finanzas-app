"use client";

import { format } from "date-fns";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { CsvTransactionRow, TransactionType } from "@/lib/types";

export type ParsedCsvData = {
  headers: string[];
  rows: Record<string, string>[];
};

const EXCEL_EXTENSIONS = [".xlsx", ".xls"] as const;

export function isExcelFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return EXCEL_EXTENSIONS.some((ext) => name.endsWith(ext));
}

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return format(value, "yyyy-MM-dd");
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value).trim();
}

function uniqueHeaders(raw: string[]): string[] {
  const counts = new Map<string, number>();

  return raw.map((header, index) => {
    const base = header.trim() || `columna_${index + 1}`;
    const count = (counts.get(base) ?? 0) + 1;
    counts.set(base, count);
    return count === 1 ? base : `${base}_${count}`;
  });
}

function findHeaderRowIndex(rows: unknown[][]): number {
  let bestIndex = 0;
  let bestScore = 0;

  for (let i = 0; i < Math.min(rows.length, 25); i++) {
    const filled = rows[i]?.filter((cell) => cellToString(cell) !== "").length ?? 0;
    if (filled > bestScore) {
      bestScore = filled;
      bestIndex = i;
    }
  }

  return bestScore >= 2 ? bestIndex : 0;
}

function rowsToParsedData(rawRows: unknown[][]): ParsedCsvData {
  const nonEmptyRows = rawRows.filter((row) =>
    row.some((cell) => cellToString(cell) !== ""),
  );

  if (nonEmptyRows.length === 0) {
    return { headers: [], rows: [] };
  }

  const headerIndex = findHeaderRowIndex(nonEmptyRows);
  const headers = uniqueHeaders(nonEmptyRows[headerIndex].map((cell) => cellToString(cell)));
  const rows: Record<string, string>[] = [];

  for (const rawRow of nonEmptyRows.slice(headerIndex + 1)) {
    const row: Record<string, string> = {};
    let hasValue = false;

    headers.forEach((header, index) => {
      const value = cellToString(rawRow[index]);
      row[header] = value;
      if (value !== "") hasValue = true;
    });

    if (hasValue) rows.push(row);
  }

  return { headers, rows };
}

export function parseCsvFile(file: File): Promise<ParsedCsvData> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields ?? [];
        resolve({
          headers,
          rows: results.data,
        });
      },
      error: (error) => reject(new Error(error.message)),
    });
  });
}

export function parseExcelFile(file: File): Promise<ParsedCsvData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const buffer = event.target?.result;
        if (!(buffer instanceof ArrayBuffer)) {
          reject(new Error("No se pudo leer el archivo Excel."));
          return;
        }

        const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          reject(new Error("El archivo Excel no contiene hojas."));
          return;
        }

        const sheet = workbook.Sheets[sheetName];
        const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
          header: 1,
          defval: "",
          raw: false,
        });

        resolve(rowsToParsedData(rawRows));
      } catch {
        reject(new Error("No se pudo leer el archivo Excel."));
      }
    };

    reader.onerror = () => reject(new Error("No se pudo leer el archivo Excel."));
    reader.readAsArrayBuffer(file);
  });
}

export async function parseImportFile(file: File): Promise<ParsedCsvData> {
  if (isExcelFile(file)) return parseExcelFile(file);
  return parseCsvFile(file);
}

export function normalizeDate(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const parts = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (parts) {
    const day = parts[1].padStart(2, "0");
    const month = parts[2].padStart(2, "0");
    const year = parts[3].length === 2 ? `20${parts[3]}` : parts[3];
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return format(parsed, "yyyy-MM-dd");
  }

  return null;
}

export function normalizeAmount(value: string): number | null {
  const cleaned = value.replace(/\$/g, "").replace(/\./g, "").replace(/,/g, ".").trim();
  const num = Number(cleaned);
  if (!Number.isFinite(num) || num <= 0) return null;
  return Math.abs(num);
}

export function buildCsvRows(
  rows: Record<string, string>[],
  mapping: { date: string; amount: string; description: string },
): { valid: CsvTransactionRow[]; skipped: number } {
  const valid: CsvTransactionRow[] = [];
  let skipped = 0;

  for (const row of rows) {
    const date = normalizeDate(row[mapping.date] ?? "");
    const amount = normalizeAmount(row[mapping.amount] ?? "");
    const description = (row[mapping.description] ?? "").trim();

    if (!date || amount === null) {
      skipped += 1;
      continue;
    }

    valid.push({ date, amount, description });
  }

  return { valid, skipped };
}

export const TRANSACTION_TYPE_OPTIONS: { value: TransactionType; label: string }[] = [
  { value: "expense", label: "Gasto" },
  { value: "income", label: "Ingreso" },
  { value: "investment", label: "Inversión" },
];

export const IMPORT_FILE_ACCEPT =
  ".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel";

export function transactionTypeLabel(type: TransactionType): string {
  return TRANSACTION_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}
