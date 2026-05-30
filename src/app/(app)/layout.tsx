import { ProtectedShell } from "@/components/layout/ProtectedShell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedShell>{children}</ProtectedShell>;
}
