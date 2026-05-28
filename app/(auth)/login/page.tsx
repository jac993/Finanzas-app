"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabasePublicConfig, SUPABASE_ENV_ERROR } from "@/lib/supabase-env";
import { supabase } from "@/lib/supabase";

type FormState = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [nextPath, setNextPath] = useState<string>("/dashboard");

  const [form, setForm] = useState<FormState>({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const { isConfigured, configError } = getSupabasePublicConfig();
    if (!isConfigured) {
      setError(configError ?? SUPABASE_ENV_ERROR);
      return;
    }

    // Evitamos useSearchParams (requiere Suspense en build).
    const nextParam = new URLSearchParams(window.location.search).get("next");
    if (nextParam) setNextPath(nextParam);

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!isMounted) return;
        if (data.session) router.replace("/dashboard");
      })
      .catch(() => {
        if (!isMounted) return;
        setError("No se pudo conectar con Supabase. Intenta de nuevo en unos minutos.");
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { isConfigured, configError } = getSupabasePublicConfig();
    if (!isConfigured) {
      setError(configError ?? SUPABASE_ENV_ERROR);
      setSubmitting(false);
      return;
    }

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (signInError) {
        setError(signInError.message);
        return;
      }
      router.refresh();
      router.replace(nextPath);
    } catch {
      setError(
        "No se pudo conectar con Supabase (Failed to fetch). Revisa que NEXT_PUBLIC_SUPABASE_URL esté en Vercel y haz Redeploy sin caché.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h1 className="text-2xl font-semibold tracking-tight">Iniciar sesión</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Accede para ver tu dashboard y tus transacciones.
      </p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-offset-2 focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-200"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="password">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={form.password}
            onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-offset-2 focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-zinc-200"
          />
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          {submitting ? "Ingresando..." : "Ingresar"}
        </button>
      </form>

      <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
        ¿No tienes cuenta?{" "}
        <Link className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-50" href="/register">
          Regístrate
        </Link>
      </p>
    </div>
  );
}

