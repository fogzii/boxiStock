import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { getAuthUser } from "@/lib/supabase/auth";

export async function ProtectedShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    data: { user },
  } = await getAuthUser();
  if (!user) redirect("/sign-in");

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
