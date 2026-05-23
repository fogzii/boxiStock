import { Badge } from "@box-ds";
import { PageHeader, Section } from "../ComponentFrame";

type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "destructive"
  | "positive"
  | "warning"
  | "negative";

function BadgeExample({
  variant,
  children,
}: {
  variant: BadgeVariant;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <Badge variant={variant}>{children}</Badge>
      <code className="rounded-sm bg-canvas px-1.5 py-1 font-mono text-caption text-mute">
        variant="{variant}"
      </code>
    </div>
  );
}

export function BadgePage() {
  return (
    <div>
      <PageHeader
        title="Badge"
        description="Inline status pill. Semantic variants use the surface + foreground token pairs from the design system."
      />

      <Section
        title="Semantic variants"
        description="Use these for inventory and order status. Warning uses bg-warning-surface (#431407) with text-warning (#fbbf24)."
        render={() => (
          <div className="flex flex-wrap items-center gap-3">
            <BadgeExample variant="positive">In stock</BadgeExample>
            <BadgeExample variant="warning">Low stock</BadgeExample>
            <BadgeExample variant="negative">Out of stock</BadgeExample>
          </div>
        )}
      />

      <Section
        title="General variants"
        render={() => (
          <div className="flex flex-wrap items-center gap-3">
            <BadgeExample variant="default">Default</BadgeExample>
            <BadgeExample variant="secondary">Secondary</BadgeExample>
            <BadgeExample variant="outline">Outline</BadgeExample>
            <BadgeExample variant="destructive">Destructive</BadgeExample>
          </div>
        )}
      />

      <Section
        title="In context — table row"
        render={() => (
          <div className="flex flex-col">
            {[
              {
                name: "Widget Pro",
                sku: "WP-001",
                status: "positive" as const,
                label: "In stock",
                qty: 142,
              },
              {
                name: "Gadget X",
                sku: "GX-002",
                status: "warning" as const,
                label: "Low stock",
                qty: 4,
              },
              {
                name: "Doohickey",
                sku: "DH-003",
                status: "negative" as const,
                label: "Out of stock",
                qty: 0,
              },
            ].map((row, idx, arr) => (
              <div
                key={row.sku}
                className={`flex items-center justify-between py-3 ${
                  idx < arr.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div>
                  <div className="text-body-sm-strong text-ink">{row.name}</div>
                  <div className="text-caption text-mute">{row.sku}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-body-sm text-body">
                    {row.qty} units
                  </span>
                  <Badge variant={row.status}>{row.label}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      />
    </div>
  );
}
