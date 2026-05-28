import type { TransactionType } from "@/lib/types";

export type ParsedTelegramTransaction = {
  type: TransactionType;
  amount: number;
  description: string;
};

export type ParseError = "empty" | "unknown_type" | "no_amount";

export type ParseResult =
  | { ok: true; value: ParsedTelegramTransaction }
  | { ok: false; error: ParseError };

const EXPENSE_WORDS = new Set([
  "gasto",
  "gaste",
  "gasté",
  "g",
  "compra",
  "compre",
  "compré",
  "pago",
  "pague",
  "pagué",
]);

const INCOME_WORDS = new Set([
  "ingreso",
  "ingrese",
  "ingresé",
  "i",
  "abono",
  "recibi",
  "recibí",
  "deposito",
  "depósito",
  "sueldo",
]);

const INVESTMENT_WORDS = new Set([
  "inversion",
  "inversión",
  "inv",
  "invertir",
  "inverti",
  "invertí",
]);

// Multiplicadores chilenos comunes: "20 mil", "20 lucas", "15k", "2 millones".
const MULTIPLIERS: Record<string, number> = {
  k: 1000,
  mil: 1000,
  luca: 1000,
  lucas: 1000,
  millon: 1_000_000,
  millón: 1_000_000,
  millones: 1_000_000,
  palo: 1_000_000,
  palos: 1_000_000,
};

function detectType(token: string): TransactionType | null {
  const normalized = token.toLowerCase();
  if (EXPENSE_WORDS.has(normalized)) return "expense";
  if (INCOME_WORDS.has(normalized)) return "income";
  if (INVESTMENT_WORDS.has(normalized)) return "investment";
  return null;
}

function parseNumber(raw: string): number | null {
  let value = raw.replace(/[$\s]/g, "");
  if (!value) return null;

  if (value.includes(".") && value.includes(",")) {
    // Formato 1.234,56 -> el punto separa miles y la coma decimales.
    value = value.replace(/\./g, "").replace(",", ".");
  } else if (value.includes(".")) {
    // Punto como separador de miles (formato chileno): 1.234 -> 1234.
    value = value.replace(/\./g, "");
  } else if (value.includes(",")) {
    value = value.replace(",", ".");
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function extractAmount(tokens: string[]): { amount: number; usedIndices: Set<number> } | null {
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i].toLowerCase().replace(/\$/g, "");
    const match = token.match(/^([\d.,]+)([a-zá]*)$/);
    if (!match) continue;

    const baseNumber = parseNumber(match[1]);
    if (baseNumber === null) continue;

    const usedIndices = new Set<number>([i]);
    let multiplier = 1;
    const suffix = match[2];

    if (suffix && MULTIPLIERS[suffix]) {
      multiplier = MULTIPLIERS[suffix];
    } else if (!suffix) {
      const next = tokens[i + 1]?.toLowerCase();
      if (next && MULTIPLIERS[next]) {
        multiplier = MULTIPLIERS[next];
        usedIndices.add(i + 1);
      }
    }

    const amount = Math.round(baseNumber * multiplier);
    if (amount <= 0) return null;

    return { amount, usedIndices };
  }

  return null;
}

/**
 * Interpreta un mensaje tipo "gasto 8500 uber transporte" o "ingreso 20 mil sueldo".
 * Devuelve el tipo, el monto y la descripción restante.
 */
export function parseTelegramTransaction(message: string): ParseResult {
  const cleaned = message.trim();
  if (!cleaned) return { ok: false, error: "empty" };

  const tokens = cleaned.split(/\s+/);
  const type = detectType(tokens[0]);
  if (!type) return { ok: false, error: "unknown_type" };

  const rest = tokens.slice(1);
  const amountResult = extractAmount(rest);
  if (!amountResult) return { ok: false, error: "no_amount" };

  const description = rest
    .filter((_, index) => !amountResult.usedIndices.has(index))
    .join(" ")
    .trim();

  return {
    ok: true,
    value: { type, amount: amountResult.amount, description },
  };
}
