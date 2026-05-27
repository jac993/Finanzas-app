import { getAnalyticsData, parseAnalyticsRange } from "@/lib/analytics";
import { AnalyticsView } from "./components/analytics-view";

type AnalyticsPageProps = {
  searchParams: Promise<{ range?: string }>;
};

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const params = await searchParams;
  const range = parseAnalyticsRange(params.range);
  const data = await getAnalyticsData(range);

  return <AnalyticsView data={data} />;
}
