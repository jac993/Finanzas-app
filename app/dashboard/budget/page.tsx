import { getBudgetPageData, getBudgetPeriodLabel, parseBudgetPeriod } from "@/lib/queries";
import { BudgetView } from "./components/budget-view";

type BudgetPageProps = {
  searchParams: Promise<{ month?: string; year?: string }>;
};

export default async function BudgetPage({ searchParams }: BudgetPageProps) {
  const params = await searchParams;
  const { month, year } = parseBudgetPeriod(params);
  const items = await getBudgetPageData(month, year);
  const periodLabel = getBudgetPeriodLabel(month, year);

  return <BudgetView items={items} month={month} year={year} periodLabel={periodLabel} />;
}
