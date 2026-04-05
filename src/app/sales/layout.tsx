import { DashboardShell } from "@/components/layout/DashboardShell";

export default function SalesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
