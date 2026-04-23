import { ProtectedShell } from "@/components/layout/ProtectedShell";

export default function StockLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedShell>{children}</ProtectedShell>;
}
