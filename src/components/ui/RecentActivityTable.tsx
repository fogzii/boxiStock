import * as React from "react";
import { cn } from "@/lib/utils";

// Mock data matching the Stitch design
const recentActivities = [
  {
    id: 1,
    itemName: "Ergonomic Chair Pro",
    type: "Sale Out",
    units: 240,
    cost: "+ $50.00",
    costColor: "text-emerald-500",
    date: "2 mins ago",
  },
  {
    id: 2,
    itemName: "Mechanical Keyboard",
    type: "Inventory Update",
    units: 12,
    cost: "- $30.00",
    costColor: "text-destructive", // using our destructive color
    date: "1 hour ago",
  },
  {
    id: 3,
    itemName: "4K Studio Monitor",
    type: "Sale Out",
    units: 899,
    cost: "+ $50.00",
    costColor: "text-emerald-500",
    date: "5 hours ago",
  },
];

export function RecentActivityTable({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-primary/5 border border-primary/10 rounded-2xl overflow-hidden",
        className,
      )}
    >
      <div className="p-4 sm:p-6 border-b border-primary/10 flex justify-between items-center">
        <h4 className="text-lg font-bold text-foreground">Recent Activity</h4>
        <button className="text-primary text-sm font-bold hover:underline">
          View All
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[600px]">
          <thead>
            <tr className="bg-primary/5 text-muted-foreground text-[10px] uppercase tracking-widest font-bold">
              <th className="px-4 sm:px-6 py-4">Item Name</th>
              <th className="px-4 sm:px-6 py-4">Transaction Type</th>
              <th className="px-4 sm:px-6 py-4">Units</th>
              <th className="px-4 sm:px-6 py-4">Cost</th>
              <th className="px-4 sm:px-6 py-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/5">
            {recentActivities.map((activity) => (
              <tr
                key={activity.id}
                className="hover:bg-primary/5 transition-colors"
              >
                <td className="px-4 sm:px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-foreground">
                      {activity.itemName}
                    </span>
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-4 text-sm text-muted-foreground">
                  {activity.type}
                </td>
                <td className="px-4 sm:px-6 py-4 text-sm font-bold text-muted-foreground">
                  {activity.units} Units
                </td>
                <td
                  className={cn(
                    "px-4 sm:px-6 py-4 text-sm font-bold",
                    activity.costColor,
                  )}
                >
                  {activity.cost}
                </td>
                <td className="px-4 sm:px-6 py-4 text-sm text-muted-foreground">
                  {activity.date}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
