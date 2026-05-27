"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/dashboard/transactions", label: "Transacciones", icon: "💸" },
  { href: "/dashboard/budget", label: "Presupuesto", icon: "🎯" },
  { href: "/dashboard/analytics", label: "Análisis y tendencias", icon: "📊" },
  { href: "/dashboard/investments", label: "Inversiones", icon: "📈" },
  { href: "/dashboard/settings", label: "Configuración", icon: "⚙️" },
];

function isActivePath(currentPath: string, href: string) {
  if (href === "/dashboard") return currentPath === "/dashboard";
  return currentPath === href || currentPath.startsWith(`${href}/`);
}

export function DashboardShell({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail: string | null;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = useMemo(() => {
    const p = pathname ?? "";
    return NAV_ITEMS.map((item) => ({ ...item, active: isActivePath(p, item.href) }));
  }, [pathname]);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900 md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Abrir menú"
            aria-expanded={mobileOpen}
          >
            ☰
          </button>

          <div className="flex flex-1 items-center gap-2">
            <span className="text-sm font-semibold tracking-tight">Finanzas</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">MVP</span>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">{userEmail ?? "—"}</span>
            <form action="/auth/signout" method="post">
              <button
                className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
                type="submit"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 px-4 py-6 md:grid-cols-[260px_1fr]">
        <aside
          className={[
            "rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-950",
            mobileOpen ? "block" : "hidden",
            "md:block",
          ].join(" ")}
        >
          <nav className="space-y-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={[
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  item.active
                    ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-950"
                    : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900",
                ].join(" ")}
              >
                <span aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800 md:hidden">
            <div className="px-2 text-xs text-zinc-500 dark:text-zinc-400">{userEmail ?? "—"}</div>
            <form className="mt-3 px-2" action="/auth/signout" method="post">
              <button
                className="inline-flex w-full items-center justify-center rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
                type="submit"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}

