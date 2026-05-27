"use client";

import { useRouter } from "next/navigation";
import type { SettingsPageData } from "@/lib/types";
import { AccountsSection } from "./accounts-section";
import { CategoriesSection } from "./categories-section";
import { ProfileSection } from "./profile-section";

export function SettingsView({ data }: { data: SettingsPageData }) {
  const router = useRouter();

  function handleChanged() {
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Administra tu perfil, cuentas y categorías.
        </p>
      </div>

      <ProfileSection profile={data.profile} />
      <AccountsSection accounts={data.accounts} onChanged={handleChanged} />
      <CategoriesSection categories={data.categories} onChanged={handleChanged} />
    </div>
  );
}
