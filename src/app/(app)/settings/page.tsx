import { AccountSettings } from "@/components/settings/AccountSettings";
import { DataManagement } from "@/components/settings/DataManagement";

export default function SettingsPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pt-6 sm:pt-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-display-md text-foreground">
            Settings
          </h1>
        </div>
      </div>

      <div className="mb-8">
        <AccountSettings />
      </div>

      <div className="mb-8">
        <DataManagement />
      </div>
    </div>
  );
}
