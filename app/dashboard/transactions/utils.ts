"use client";

import { format } from "date-fns";
import Papa from "papaparse";
import type { CsvTransactionRow, TransactionType } from "@/lib/types";

export type ParsedCsvData = {
  headers: string[];
  rows: Record<string, string>[];
};

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

export function transactionTypeLabel(type: TransactionType): string {
  return TRANSACTION_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}
