import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";

/**
 * Server-component wrapper that gates every protected section of the app.
 *
 * The Clerk `proxy.ts` already blocks unauthenticated requests at the edge,
 * but this provides defense-in-depth: if the proxy is ever misconfigured,
 * disabled, or the route is rendered in a different runtime, the user still
 * gets bounced to sign-in instead of reaching the dashboard shell.
 */
export async function ProtectedShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return <DashboardShell>{children}</DashboardShell>;
}
