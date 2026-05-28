import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { TelegramLinkStatus } from "@/lib/types";

async function getUserId(): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("No hay sesión activa.");
  return data.user.id;
}

function generateCode(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "0123456789";
  const pick = (set: string, length: number) =>
    Array.from({ length }, () => set[Math.floor(Math.random() * set.length)]).join("");
  return `${pick(letters, 3)}-${pick(digits, 3)}`;
}

export async function getTelegramLinkStatus(): Promise<TelegramLinkStatus> {
  const empty: TelegramLinkStatus = { linked: false, linkCode: null, chatId: null };

  try {
    const supabase = await createSupabaseServerClient();
    const userId = await getUserId();

    const { data, error } = await supabase
      .from("telegram_links")
      .select("link_code, telegram_chat_id")
      .eq("user_id", userId)
      .maybeSingle();

    // Si la tabla aún no existe (el usuario no corrió el SQL), no rompemos la página.
    if (error) return empty;
    if (!data) return empty;

    return {
      linked: Boolean(data.telegram_chat_id),
      linkCode: data.link_code,
      chatId: data.telegram_chat_id,
    };
  } catch {
    return empty;
  }
}

export async function generateTelegramLinkCode(): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const userId = await getUserId();
  const code = generateCode();

  const { error } = await supabase
    .from("telegram_links")
    .upsert({ user_id: userId, link_code: code }, { onConflict: "user_id" });

  if (error) throw new Error(error.message);
  return code;
}

export async function unlinkTelegram(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const userId = await getUserId();

  const { error } = await supabase.from("telegram_links").delete().eq("user_id", userId);
  if (error) throw new Error(error.message);
}
