"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Account } from "@/lib/types";

export function AccountFilter({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedAccountId = searchParams.get("accountId");

  function setAccount(accountId: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (accountId) {
      params.set("accountId", accountId);
    } else {
      params.delete("accountId");
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => setAccount(null)}
        className={[
          "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
          !selectedAccountId
            ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-950"
            : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900",
        ].join(" ")}
      >
        Todas
      </button>
      {accounts.map((account) => (
        <button
          key={account.id}
          type="button"
          onClick={() => setAccount(account.id)}
          className={[
            "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
            selectedAccountId === account.id
              ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-950"
              : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900",
          ].join(" ")}
        >
          {account.name}
        </button>
      ))}
    </div>
  );
}
