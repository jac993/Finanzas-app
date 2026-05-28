import { NextResponse, type NextRequest } from "next/server";
import { formatCLP } from "@/lib/formatters";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendTelegramMessage } from "@/lib/telegram/client";
import { parseTelegramTransaction, type ParseError, type ParsedTelegramTransaction } from "@/lib/telegram/parser";
import type { TransactionType } from "@/lib/types";

type TelegramUpdate = {
  message?: {
    text?: string;
    chat?: { id?: number };
  };
};

type CategoryRow = { id: string; name: string };

const TYPE_LABEL: Record<TransactionType, string> = {
  expense: "Gasto",
  income: "Ingreso",
  investment: "Inversión",
};

const HELP_MESSAGE = [
  "<b>Cómo registrar transacciones</b>",
  "",
  "Escribe: <code>tipo monto descripción categoría</code>",
  "",
  "Ejemplos:",
  "• <code>gasto 8500 uber transporte</code>",
  "• <code>gasto 15 mil almuerzo alimentación</code>",
  "• <code>ingreso 800000 sueldo</code>",
  "• <code>g 5000 cafe</code>",
  "",
  "Palabras para el tipo:",
  "• Gasto: gasto, g, compra, pago",
  "• Ingreso: ingreso, i, abono, sueldo",
  "• Inversión: inversion, inv",
  "",
  "Comandos: /cuentas, /categorias, /ayuda",
].join("\n");

const NOT_LINKED_MESSAGE = [
  "Aún no vinculas tu cuenta.",
  "",
  "1. Abre la app → Configuración → Telegram",
  "2. Genera tu código",
  "3. Envíame: <code>/start TU-CODIGO</code>",
].join("\n");

const START_NO_CODE_MESSAGE = [
  "¡Hola! Soy tu bot de finanzas.",
  "",
  "Para vincular tu cuenta, genera un código en la app (Configuración → Telegram) y envíame:",
  "<code>/start TU-CODIGO</code>",
].join("\n");

function parseErrorMessage(error: ParseError): string {
  if (error === "no_amount") {
    return "No encontré el monto. Ejemplo: <code>gasto 8500 almuerzo</code>";
  }
  if (error === "unknown_type") {
    return "No entendí el tipo. Empieza con <b>gasto</b> o <b>ingreso</b>. Escribe /ayuda para ver ejemplos.";
  }
  return "Mensaje vacío. Escribe /ayuda para ver ejemplos.";
}

function matchCategory(categories: CategoryRow[], description: string): CategoryRow | null {
  const text = description.toLowerCase();
  for (const category of categories) {
    if (text.includes(category.name.toLowerCase())) {
      return category;
    }
  }
  return null;
}

async function safeSend(chatId: string, text: string): Promise<void> {
  try {
    await sendTelegramMessage(chatId, text);
  } catch {
    // Evitamos que un fallo al responder rompa el webhook.
  }
}

async function linkAccount(chatId: string, rawCode: string): Promise<void> {
  const admin = getSupabaseAdminClient();
  const code = rawCode.trim().toUpperCase();

  const { data: link } = await admin
    .from("telegram_links")
    .select("user_id")
    .eq("link_code", code)
    .maybeSingle();

  if (!link) {
    await safeSend(chatId, "Código inválido. Genera uno nuevo en la app (Configuración → Telegram).");
    return;
  }

  const { error } = await admin
    .from("telegram_links")
    .update({ telegram_chat_id: chatId, linked_at: new Date().toISOString() })
    .eq("link_code", code);

  if (error) {
    await safeSend(chatId, "No se pudo vincular. Es posible que este Telegram ya esté vinculado a otra cuenta.");
    return;
  }

  await safeSend(
    chatId,
    "✅ ¡Cuenta vinculada! Ya puedes registrar transacciones. Escribe /ayuda para ver ejemplos.",
  );
}

async function listAccounts(chatId: string, userId: string): Promise<void> {
  const admin = getSupabaseAdminClient();
  const { data } = await admin
    .from("accounts")
    .select("name")
    .eq("user_id", userId)
    .order("name");

  if (!data || data.length === 0) {
    await safeSend(chatId, "No tienes cuentas. Crea una en la app (Configuración → Cuentas).");
    return;
  }

  const lines = data.map((account) => `• ${account.name}`).join("\n");
  await safeSend(chatId, `<b>Tus cuentas</b>\n${lines}\n\nLas transacciones se guardan en la primera por defecto.`);
}

async function listCategories(chatId: string, userId: string): Promise<void> {
  const admin = getSupabaseAdminClient();
  const { data } = await admin
    .from("categories")
    .select("name, type")
    .eq("user_id", userId)
    .order("name");

  if (!data || data.length === 0) {
    await safeSend(chatId, "No tienes categorías. Créalas en la app (Configuración → Categorías).");
    return;
  }

  const lines = data.map((category) => `• ${category.name}`).join("\n");
  await safeSend(chatId, `<b>Tus categorías</b>\n${lines}`);
}

async function createTransactionForUser(
  chatId: string,
  userId: string,
  parsed: ParsedTelegramTransaction,
): Promise<void> {
  const admin = getSupabaseAdminClient();

  const { data: accounts } = await admin
    .from("accounts")
    .select("id, name")
    .eq("user_id", userId)
    .order("name")
    .limit(1);

  const account = accounts?.[0];
  if (!account) {
    await safeSend(
      chatId,
      "No tienes cuentas creadas. Crea una en la app (Configuración → Cuentas) antes de registrar transacciones.",
    );
    return;
  }

  let categoryId: string | null = null;
  let categoryName: string | null = null;

  if (parsed.description) {
    const { data: categories } = await admin
      .from("categories")
      .select("id, name")
      .eq("user_id", userId)
      .eq("type", parsed.type);

    const match = matchCategory(categories ?? [], parsed.description);
    if (match) {
      categoryId = match.id;
      categoryName = match.name;
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  const { error } = await admin.from("transactions").insert({
    user_id: userId,
    account_id: account.id,
    category_id: categoryId,
    amount: parsed.amount,
    type: parsed.type,
    description: parsed.description || null,
    date: today,
    source: "manual",
  });

  if (error) throw new Error(error.message);

  const lines = [
    `✅ ${TYPE_LABEL[parsed.type]} ${formatCLP(parsed.amount)}`,
    parsed.description ? `📝 ${parsed.description}` : null,
    `📁 ${categoryName ?? "Sin categoría"}`,
    `💳 ${account.name}`,
  ].filter(Boolean);

  await safeSend(chatId, lines.join("\n"));
}

async function handleMessage(chatId: string, text: string): Promise<void> {
  if (text.startsWith("/start")) {
    const code = text.split(/\s+/)[1];
    if (!code) {
      await safeSend(chatId, START_NO_CODE_MESSAGE);
      return;
    }
    await linkAccount(chatId, code);
    return;
  }

  const lower = text.toLowerCase();
  if (lower === "/ayuda" || lower === "/help" || lower === "ayuda") {
    await safeSend(chatId, HELP_MESSAGE);
    return;
  }

  const admin = getSupabaseAdminClient();
  const { data: link } = await admin
    .from("telegram_links")
    .select("user_id")
    .eq("telegram_chat_id", chatId)
    .maybeSingle();

  if (!link) {
    await safeSend(chatId, NOT_LINKED_MESSAGE);
    return;
  }

  if (lower === "/cuentas") {
    await listAccounts(chatId, link.user_id);
    return;
  }
  if (lower === "/categorias") {
    await listCategories(chatId, link.user_id);
    return;
  }

  const parsed = parseTelegramTransaction(text);
  if (!parsed.ok) {
    await safeSend(chatId, parseErrorMessage(parsed.error));
    return;
  }

  await createTransactionForUser(chatId, link.user_id, parsed.value);
}

export async function POST(req: NextRequest) {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const secret = req.headers.get("x-telegram-bot-api-secret-token");

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = (await req.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ ok: true });
  }

  const text = update.message?.text?.trim();
  const chatId = update.message?.chat?.id;

  if (!text || chatId === undefined) {
    return NextResponse.json({ ok: true });
  }

  try {
    await handleMessage(String(chatId), text);
  } catch {
    await safeSend(String(chatId), "⚠️ Ocurrió un error procesando tu mensaje. Intenta de nuevo.");
  }

  return NextResponse.json({ ok: true });
}
