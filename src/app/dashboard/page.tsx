import { StatCard } from "@/components/ui/StatCard";
import { ProfitChart } from "@/components/ui/ProfitChart";
import { RecentActivityTable } from "@/components/ui/RecentActivityTable";
import { Wallet, Package } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 px-4 sm:px-8 pt-6 sm:pt-8">
      <div className="mb-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Dashboard Overview
        </h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Lifetime Profit"
          value="$128,430.00"
          icon={Wallet}
        />
        <StatCard
          title="Current Inventory Value"
          value="$45,210.50"
          icon={Package}
        />
      </div>

      {/* Main Chart Card */}
      <div className="mb-8">
        <ProfitChart />
      </div>

      {/* Recent Activity */}
      <div>
        <RecentActivityTable />
      </div>
    </div>
  );
}
