import { endOfMonth, format, startOfMonth } from "date-fns";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Investment,
  InvestmentInput,
  InvestmentListItem,
  InvestmentsPageData,
  InvestmentsSummary,
} from "@/lib/types";

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return typeof value === "number" ? value : Number(value);
}

async function getAuthenticatedUserId(): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("No hay sesión activa.");
  return data.user.id;
}

function mapInvestmentItem(row: Investment): InvestmentListItem {
  const initialAmount = toNumber(row.initial_amount);
  const currentAmount = toNumber(row.current_amount);
  const totalReturn = currentAmount - initialAmount;
  const returnPercent = initialAmount === 0 ? 0 : (totalReturn / initialAmount) * 100;
  const growthProgress = Math.min(Math.max(returnPercent, 0), 100);

  return {
    id: row.id,
    name: row.name,
    type: row.type,
    initialAmount,
    currentAmount,
    currency: row.currency,
    startedAt: row.started_at,
    totalReturn,
    returnPercent,
    growthProgress,
  };
}

function buildSummary(items: InvestmentListItem[]): InvestmentsSummary {
  const totalInvested = items.reduce((acc, item) => acc + item.initialAmount, 0);
  const totalCurrent = items.reduce((acc, item) => acc + item.currentAmount, 0);
  const totalReturn = totalCurrent - totalInvested;

  const now = new Date();
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");

  const monthItems = items.filter(
    (item) => item.startedAt && item.startedAt >= monthStart && item.startedAt <= monthEnd,
  );

  const ranked = (monthItems.length > 0 ? monthItems : items)
    .slice()
    .sort((a, b) => b.returnPercent - a.returnPercent);

  const best = ranked[0];

  return {
    totalInvested,
    totalCurrent,
    totalReturn,
    bestInvestment: best ? { name: best.name, returnPercent: best.returnPercent } : null,
  };
}

export async function getInvestments(): Promise<Investment[]> {
  const supabase = await createSupabaseServerClient();
  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from("investments")
    .select("id, user_id, name, type, initial_amount, current_amount, currency, started_at, created_at")
    .eq("user_id", userId)
    .order("name");

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    ...row,
    initial_amount: toNumber(row.initial_amount),
    current_amount: toNumber(row.current_amount),
  })) as Investment[];
}

export async function getInvestmentsPageData(): Promise<InvestmentsPageData> {
  const investments = await getInvestments();
  const items = investments.map(mapInvestmentItem);

  return {
    summary: buildSummary(items),
    items: items.sort((a, b) => b.returnPercent - a.returnPercent),
  };
}

export async function createInvestment(input: InvestmentInput): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const userId = await getAuthenticatedUserId();

  const { error } = await supabase.from("investments").insert({
    user_id: userId,
    name: input.name,
    type: input.type,
    initial_amount: input.initialAmount,
    current_amount: input.currentAmount,
    currency: input.currency,
    started_at: input.startedAt,
  });

  if (error) throw new Error(error.message);
}

export async function updateInvestmentCurrentAmount(id: string, currentAmount: number): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const userId = await getAuthenticatedUserId();

  const { error } = await supabase
    .from("investments")
    .update({ current_amount: currentAmount })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}
