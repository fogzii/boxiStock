import {
  Badge,
  Button,
  CustomTooltip,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@box-ds";
import { GroupHeading, PageHeader, Section } from "../ComponentFrame";

export function MiscPage() {
  return (
    <div>
      <PageHeader
        title="Data & Feedback"
        description="Supporting components for loading states, data display, and contextual help."
      />

      <GroupHeading>Skeleton</GroupHeading>

      <Section
        title="Loading placeholders"
        description="Use Skeleton to represent content while data is fetching."
        render={() => (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-3.5 w-3/5" />
                <Skeleton className="h-3 w-2/5" />
              </div>
            </div>
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-20 w-full rounded-md" />
          </div>
        )}
      />

      <GroupHeading>Table</GroupHeading>

      <Section
        title="Data table"
        description="Standard table with header, body, and row hover states."
        render={() => (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                {
                  name: "Widget Pro",
                  sku: "WP-001",
                  status: "positive" as const,
                  label: "In stock",
                  value: "$2,400",
                },
                {
                  name: "Gadget X",
                  sku: "GX-002",
                  status: "warning" as const,
                  label: "Low stock",
                  value: "$840",
                },
                {
                  name: "Doohickey",
                  sku: "DH-003",
                  status: "negative" as const,
                  label: "Out of stock",
                  value: "$0",
                },
              ].map((row) => (
                <TableRow key={row.sku}>
                  <TableCell className="text-body-sm-strong">
                    {row.name}
                  </TableCell>
                  <TableCell className="font-mono text-caption text-mute">
                    {row.sku}
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.status}>{row.label}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{row.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      />

      <GroupHeading>Tooltip</GroupHeading>

      <Section
        title="Contextual tooltip"
        description="Hover the buttons to see the tooltip."
        render={() => (
          <div className="flex flex-wrap gap-3">
            <CustomTooltip content="Add a new product to inventory">
              <Button variant="outline">Add product</Button>
            </CustomTooltip>
            <CustomTooltip content="Permanently delete this item. This action cannot be undone.">
              <Button variant="destructive">Delete</Button>
            </CustomTooltip>
            <CustomTooltip content="Export as CSV">
              <Button variant="ghost">Export</Button>
            </CustomTooltip>
          </div>
        )}
      />
    </div>
  );
}
