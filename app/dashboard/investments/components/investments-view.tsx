"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { InvestmentsPageData, InvestmentListItem } from "@/lib/types";
import { EditInvestmentModal, InvestmentsList } from "./investments-list";
import { InvestmentModal } from "./investment-modal";
import { InvestmentsSummaryCards } from "./investments-summary";

export function InvestmentsView({ data }: { data: InvestmentsPageData }) {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<InvestmentListItem | null>(null);

  function handleMutationComplete() {
    setShowCreateModal(false);
    setEditingInvestment(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inversiones</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Administra tu portafolio y actualiza los valores actuales.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          + Nueva inversión
        </button>
      </div>

      <InvestmentsSummaryCards summary={data.summary} />
      <InvestmentsList items={data.items} onEdit={setEditingInvestment} />

      {showCreateModal ? (
        <InvestmentModal onClose={() => setShowCreateModal(false)} onSuccess={handleMutationComplete} />
      ) : null}

      {editingInvestment ? (
        <EditInvestmentModal
          investment={editingInvestment}
          onClose={() => setEditingInvestment(null)}
          onSuccess={handleMutationComplete}
        />
      ) : null}
    </div>
  );
}
