import { formatCLP, formatPercent } from "@/lib/formatters";
import type { InvestmentAnalyticsItem } from "@/lib/types";

export function InvestmentsAnalyticsSection({
  investments,
  monthlyFlow,
}: {
  investments: InvestmentAnalyticsItem[];
  monthlyFlow: number;
}) {
  if (investments.length === 0) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold tracking-tight">Inversiones</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Aún no hay inversiones registradas.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Inversiones</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Evolución estimada del mes según movimientos de inversión.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 px-4 py-2 text-sm dark:border-zinc-800">
          Flujo neto del mes:{" "}
          <span className={monthlyFlow >= 0 ? "text-emerald-600" : "text-red-600"}>
            {monthlyFlow >= 0 ? "+" : ""}
            {formatCLP(monthlyFlow)}
          </span>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {investments.map((investment) => (
          <article
            key={investment.id}
            className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold">{investment.name}</h3>
                <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {investment.type}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                <div>
                  <p className="text-xs text-zinc-500">Inicial</p>
                  <p className="font-medium">{formatCLP(investment.initialAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Actual</p>
                  <p className="font-medium">{formatCLP(investment.currentAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Rentabilidad</p>
                  <p className={investment.totalReturn >= 0 ? "font-medium text-emerald-600" : "font-medium text-red-600"}>
                    {formatPercent(investment.returnPercent)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Cambio del mes</p>
                  <p className={investment.monthlyChange >= 0 ? "font-medium text-emerald-600" : "font-medium text-red-600"}>
                    {investment.monthlyChange >= 0 ? "+" : ""}
                    {formatCLP(investment.monthlyChange)}
                  </p>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
