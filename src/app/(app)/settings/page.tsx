import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { DataManagement } from "@/components/settings/DataManagement";

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" />

      <PageBody>
        <div className="mb-8">
          <AccountSettings />
        </div>

        <div className="mb-8">
          <DataManagement />
        </div>
      </PageBody>
    </>
  );
}
