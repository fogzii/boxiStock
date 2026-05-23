import { cn } from "@/lib/utils";

interface RecentActivity {
  id: string;
  itemName: string;
  type: string;
  units: number;
  cost: string;
  costColor?: string;
  date: string;
}

// TODO: Replace with real Sale records in the future
const recentActivities: RecentActivity[] = [];

export function RecentActivityTable({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-primary/5 border border-primary/10 rounded-2xl overflow-hidden",
        className,
      )}
    >
      <div className="p-4 sm:p-6 border-b border-primary/10 flex justify-between items-center">
        <h4 className="font-display text-display-xs text-foreground">
          Recent Activity
        </h4>
        <button
          type="button"
          className="text-primary text-body-sm-strong hover:underline"
          disabled
        >
          View All
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[600px]">
          <thead>
            <tr className="bg-primary/5 text-muted-foreground text-caption uppercase tracking-widest">
              <th className="px-4 sm:px-6 py-4">Item Name</th>
              <th className="px-4 sm:px-6 py-4">Transaction Type</th>
              <th className="px-4 sm:px-6 py-4">Units</th>
              <th className="px-4 sm:px-6 py-4">Cost</th>
              <th className="px-4 sm:px-6 py-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/5">
            {recentActivities.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground text-body-sm"
                >
                  No recent activity found.
                </td>
              </tr>
            ) : (
              recentActivities.map((activity) => (
                <tr
                  key={activity.id}
                  className="hover:bg-primary/5 transition-colors"
                >
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-body-sm-strong text-foreground">
                        {activity.itemName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-body-sm text-muted-foreground">
                    {activity.type}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-body-sm-strong text-muted-foreground">
                    {activity.units} Units
                  </td>
                  <td
                    className={cn(
                      "px-4 sm:px-6 py-4 text-body-sm-strong",
                      activity.costColor,
                    )}
                  >
                    {activity.cost}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-body-sm text-muted-foreground">
                    {activity.date}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
