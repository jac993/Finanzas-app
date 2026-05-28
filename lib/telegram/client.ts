const TELEGRAM_API_BASE = "https://api.telegram.org";

export function getTelegramBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("Falta la variable de entorno TELEGRAM_BOT_TOKEN.");
  }
  return token;
}

export async function sendTelegramMessage(chatId: string | number, text: string): Promise<void> {
  const token = getTelegramBotToken();

  await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });
}
