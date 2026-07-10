import { auth } from "@/lib/auth";
import { logAuthError } from "@/lib/auth-errors";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardShell from "./DashboardShell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Opt out of static prerendering so unauthenticated users always hit auth().
  await headers();

  let session;

  try {
    session = await auth();
  } catch (error) {
    logAuthError("Dashboard layout: session lookup failed", error);
    redirect("/login?error=Configuration&callbackUrl=%2Fdashboard");
  }

  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fdashboard");
  }

  return <DashboardShell>{children}</DashboardShell>;
}
