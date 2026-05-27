import { getSettingsPageData } from "@/lib/settings";
import { SettingsView } from "./components/settings-view";

export default async function SettingsPage() {
  const data = await getSettingsPageData();
  return <SettingsView data={data} />;
}
