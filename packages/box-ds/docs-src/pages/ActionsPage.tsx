import { ActionMenu, Badge, Button } from "@box-ds";
import { ArrowRight, Copy, Edit2, GitMerge, Plus, Trash2 } from "lucide-react";
import { GroupHeading, PageHeader, Section } from "../ComponentFrame";

// ─── Badge helpers ────────────────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ActionsPage() {
  return (
    <div>
      <PageHeader
        title="Actions"
        description="Interactive controls — buttons for triggering operations, badges for conveying status, and the action menu for secondary row-level actions."
      />

      {/* ── Button ── */}
      <GroupHeading>Button</GroupHeading>

      <Section
        title="Variants"
        render={() => (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="default">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="destructive-outline">Destructive outline</Button>
            <Button variant="destructive-ghost">Destructive ghost</Button>
          </div>
        )}
      />

      <Section
        title="Sizes"
        description="Default height is 36px (h-9). xs → sm → default → lg. Icon variants are square."
        render={() => (
          <div className="flex flex-wrap items-center gap-2">
            <Button size="xs">Extra small</Button>
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon">
              <Plus />
            </Button>
            <Button size="icon-sm">
              <Plus />
            </Button>
            <Button size="icon-lg">
              <Plus />
            </Button>
          </div>
        )}
      />

      <Section
        title="With icons"
        render={() => (
          <div className="flex flex-wrap items-center gap-2">
            <Button>
              <Plus /> Add item
            </Button>
            <Button variant="outline">
              Export <ArrowRight />
            </Button>
            <Button variant="destructive">
              <Trash2 /> Delete
            </Button>
          </div>
        )}
      />

      <Section
        title="States"
        render={() => (
          <div className="flex flex-wrap items-center gap-2">
            <Button disabled>Disabled</Button>
            <Button variant="outline" disabled>
              Disabled outline
            </Button>
            <Button variant="default">Loading…</Button>
          </div>
        )}
      />

      {/* ── Badge ── */}
      <GroupHeading>Badge</GroupHeading>

      <Section
        title="Semantic variants"
        description="Use for inventory and order status. Surface + foreground token pairs from the design system."
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
                className={`flex items-center justify-between py-3 ${idx < arr.length - 1 ? "border-b border-border" : ""}`}
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

      {/* ── Action menu ── */}
      <GroupHeading>Action menu</GroupHeading>

      <Section
        title="Default — opens below, aligned end"
        description="MoreVertical trigger. Menu floats downward from the trailing edge. Default width: auto (min 180px)."
        render={() => (
          <div className="flex justify-end pb-20">
            <ActionMenu
              items={[
                { label: "Merge sales", icon: <GitMerge />, onClick: () => {} },
                { label: "Edit", icon: <Edit2 />, onClick: () => {} },
                { label: "Duplicate", icon: <Copy />, onClick: () => {} },
                {
                  label: "Delete",
                  icon: <Trash2 />,
                  variant: "destructive",
                  onClick: () => {},
                },
              ]}
            />
          </div>
        )}
      />

      <Section
        title="Opens above"
        description="Use side='top' when the trigger is near the bottom of the viewport."
        render={() => (
          <div className="flex justify-end pt-20">
            <ActionMenu
              side="top"
              items={[
                { label: "Merge sales", icon: <GitMerge />, onClick: () => {} },
                { label: "Edit", icon: <Edit2 />, onClick: () => {} },
                {
                  label: "Delete",
                  icon: <Trash2 />,
                  variant: "destructive",
                  onClick: () => {},
                },
              ]}
            />
          </div>
        )}
      />

      <Section
        title="With disabled item"
        description="Disabled items are dimmed and non-interactive."
        render={() => (
          <div className="flex justify-end pb-20">
            <ActionMenu
              items={[
                { label: "Merge sales", icon: <GitMerge />, onClick: () => {} },
                {
                  label: "Edit",
                  icon: <Edit2 />,
                  disabled: true,
                  onClick: () => {},
                },
                {
                  label: "Delete",
                  icon: <Trash2 />,
                  variant: "destructive",
                  onClick: () => {},
                },
              ]}
            />
          </div>
        )}
      />
    </div>
  );
}
