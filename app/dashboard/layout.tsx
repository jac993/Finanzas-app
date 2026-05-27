import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DashboardShell } from "./ui/dashboard-shell";

export const metadata: Metadata = {
  title: "Dashboard | Finanzas",
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  return <DashboardShell userEmail={data.user?.email ?? null}>{children}</DashboardShell>;
}

