import { DataManagement } from "@/components/settings/DataManagement";

export default function SettingsPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 px-4 sm:px-8 pt-6 sm:pt-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Settings
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">
            Manage your application data
          </p>
        </div>
      </div>

      <div className="mb-8">
        <DataManagement />
      </div>
    </div>
  );
}
