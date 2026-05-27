import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <main className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold tracking-tight">Finanzas personales</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          MVP con Next.js + Supabase. Entra para comenzar.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <Link
            className="inline-flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
            href="/login"
          >
            Iniciar sesión
          </Link>
          <Link
            className="inline-flex w-full items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
            href="/register"
          >
            Crear cuenta
          </Link>
        </div>
      </main>
    </div>
  );
}
