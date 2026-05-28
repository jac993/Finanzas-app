"use client";

import { useState, useTransition } from "react";
import type { TelegramLinkStatus } from "@/lib/types";
import { generateTelegramCodeAction, unlinkTelegramAction } from "../telegram-actions";

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

export function TelegramSection({
  status,
  onChanged,
}: {
  status: TelegramLinkStatus;
  onChanged: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [code, setCode] = useState<string | null>(status.linkCode);
  const [error, setError] = useState<string | null>(null);

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await generateTelegramCodeAction();
      if (!result.success || !result.code) {
        setError(result.message ?? "No se pudo generar el código.");
        return;
      }
      setCode(result.code);
      onChanged();
    });
  }

  function handleUnlink() {
    setError(null);
    startTransition(async () => {
      const result = await unlinkTelegramAction();
      if (!result.success) {
        setError(result.message ?? "No se pudo desvincular.");
        return;
      }
      setCode(null);
      onChanged();
    });
  }

  const botLink = BOT_USERNAME ? `https://t.me/${BOT_USERNAME}` : null;

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-lg font-semibold tracking-tight">Telegram</h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Registra transacciones rápidamente desde un chat de Telegram.
      </p>

      {status.linked ? (
        <div className="mt-5 space-y-4">
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
            <span>✅</span>
            <span>Telegram vinculado. Escribe a tu bot, por ejemplo: <code>gasto 8500 uber transporte</code></span>
          </div>
          <button
            type="button"
            onClick={handleUnlink}
            disabled={isPending}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            Desvincular Telegram
          </button>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <ol className="list-decimal space-y-2 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
            <li>Genera tu código de vinculación.</li>
            <li>
              Abre tu bot en Telegram
              {botLink ? (
                <>
                  {" "}
                  (
                  <a
                    href={botLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline underline-offset-4"
                  >
                    {`@${BOT_USERNAME}`}
                  </a>
                  )
                </>
              ) : null}
              .
            </li>
            <li>
              Envíale: <code>/start TU-CODIGO</code>
            </li>
          </ol>

          {code ? (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Tu código (envíalo al bot):</p>
              <p className="mt-1 select-all font-mono text-lg font-semibold tracking-widest">
                /start {code}
              </p>
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isPending}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {code ? "Generar nuevo código" : "Generar código de vinculación"}
          </button>
        </div>
      )}

      {error ? <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
    </section>
  );
}
