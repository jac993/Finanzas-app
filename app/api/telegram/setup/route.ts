import { NextResponse, type NextRequest } from "next/server";
import { getTelegramBotToken } from "@/lib/telegram/client";

/**
 * Registra el webhook de Telegram apuntando a /api/telegram/webhook.
 * Úsalo una sola vez abriendo en el navegador:
 *   https://TU-APP.vercel.app/api/telegram/setup?secret=TU_WEBHOOK_SECRET
 */
export async function GET(req: NextRequest) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  const secret = req.nextUrl.searchParams.get("secret");

  if (!expected || secret !== expected) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  let token: string;
  try {
    token = getTelegramBotToken();
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Token no configurado." },
      { status: 500 },
    );
  }

  const webhookUrl = `${req.nextUrl.origin}/api/telegram/webhook`;

  const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: expected,
      allowed_updates: ["message"],
    }),
  });

  const result = await response.json();
  return NextResponse.json({ ok: response.ok, webhookUrl, telegram: result });
}
