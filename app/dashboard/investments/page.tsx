import { getInvestmentsPageData } from "@/lib/investments";
import { InvestmentsView } from "./components/investments-view";

export default async function InvestmentsPage() {
  const data = await getInvestmentsPageData();
  return <InvestmentsView data={data} />;
}
