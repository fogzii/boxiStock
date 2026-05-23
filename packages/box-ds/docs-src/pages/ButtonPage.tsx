import { Button } from "@box-ds";
import { ArrowRight, Plus, Trash2 } from "lucide-react";
import { PageHeader, Section } from "../ComponentFrame";

export function ButtonPage() {
  return (
    <div>
      <PageHeader
        title="Button"
        description="Primary interaction element. Uses rounded-xl (24px via design token) and Manrope 600."
      />

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
        description="xs · sm · default · lg · icon"
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
    </div>
  );
}
