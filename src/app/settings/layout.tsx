import { ProtectedShell } from "@/components/layout/ProtectedShell";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedShell>{children}</ProtectedShell>;
}
