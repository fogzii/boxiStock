import { DashboardShell } from "@/components/layout/DashboardShell";

export default function StockLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
