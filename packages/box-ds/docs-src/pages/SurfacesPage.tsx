import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Modal,
  ModalActions,
} from "@box-ds";
import { useState } from "react";
import { GroupHeading, PageHeader, Section } from "../ComponentFrame";

// ─── Modal helpers ─────────────────────────────────────────────────────────────

function ModalDemo({
  title,
  destructive,
}: {
  title: string;
  destructive?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant={destructive ? "destructive" : "default"}
        onClick={() => setOpen(true)}
      >
        Open {title.toLowerCase()}
      </Button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title={title}>
        <p className="m-0 mb-6 text-body-md text-body">
          This is an example modal. It uses a portal to render above the page
          and closes on Escape or backdrop click.
        </p>
        <ModalActions
          onCancel={() => setOpen(false)}
          submitLabel={destructive ? "Delete" : "Confirm"}
          destructive={destructive}
        />
      </Modal>
    </>
  );
}

function LoadingDemo() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleSubmit() {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setOpen(false);
    }, 1800);
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open with loading</Button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Save changes">
        <p className="m-0 mb-6 text-body-md text-body">
          Click confirm to simulate an async action.
        </p>
        <ModalActions
          onCancel={() => setOpen(false)}
          submitLabel="Save"
          loadingLabel="Saving…"
          isLoading={loading}
          // biome-ignore lint/suspicious/noExplicitAny: demo
          {...({ onClick: handleSubmit } as any)}
        />
      </Modal>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function SurfacesPage() {
  return (
    <div>
      <PageHeader
        title="Surfaces"
        description="Container components that establish visual layers — cards for inline content blocks, modals for focused overlay flows."
      />

      {/* ── Card ── */}
      <GroupHeading>Card</GroupHeading>

      <Section
        title="Default size"
        description="Card fills its container (width: 100%). Control the footprint via the parent — e.g. max-w-xs for a narrow widget, or place cards in a grid."
        render={() => (
          <div className="max-w-xs">
            <Card>
              <CardHeader>
                <CardTitle>Inventory summary</CardTitle>
                <CardDescription>
                  Total stock value across all warehouses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="m-0 font-display text-display-md text-ink">
                  $48,200
                </p>
                <p className="mt-1 text-body-sm text-body">
                  Updated 2 minutes ago
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      />

      <Section
        title="With action"
        render={() => (
          <div className="max-w-xs">
            <Card>
              <CardHeader>
                <CardTitle>Recent sales</CardTitle>
                <CardDescription>Last 30 days</CardDescription>
                <CardAction>
                  <Button size="sm" variant="outline">
                    View all
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent>
                <p className="m-0 text-body-sm text-body">
                  No sales data to display.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      />

      <Section
        title="With footer"
        render={() => (
          <div className="max-w-xs">
            <Card>
              <CardHeader>
                <CardTitle>Low stock alert</CardTitle>
                <CardDescription>3 products below threshold</CardDescription>
                <CardAction>
                  <Badge variant="warning">3 items</Badge>
                </CardAction>
              </CardHeader>
              <CardContent>
                <p className="m-0 text-body-sm text-body">
                  Widget Pro, Gadget X, and Doohickey are running low.
                </p>
              </CardContent>
              <CardFooter>
                <Button size="sm">Review stock</Button>
                <Button size="sm" variant="ghost">
                  Dismiss
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      />

      <Section
        title="Small size (size=sm)"
        description="Reduced padding for dense layouts. Default is size=default."
        render={() => (
          <div className="max-w-xs">
            <Card size="sm">
              <CardHeader>
                <CardTitle>Compact card</CardTitle>
                <CardDescription>
                  Reduced padding for dense views
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="m-0 text-body-sm text-body">
                  Content inside a size=sm card.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      />

      <Section
        title="Full-width (default container behaviour)"
        description="Without a width constraint the card stretches to fill its container — useful in a grid or sidebar."
        render={() => (
          <Card>
            <CardHeader>
              <CardTitle>Full-width card</CardTitle>
              <CardDescription>
                No max-width applied — fills the preview frame
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="m-0 text-body-sm text-body">
                Place cards inside a grid or set max-w-* on the parent.
              </p>
            </CardContent>
          </Card>
        )}
      />

      {/* ── Modal ── */}
      <GroupHeading>Modal</GroupHeading>

      <Section
        title="Default modal"
        render={() => <ModalDemo title="Example modal" />}
      />

      <Section
        title="Destructive modal"
        render={() => <ModalDemo title="Delete product" destructive />}
      />

      <Section title="With loading state" render={() => <LoadingDemo />} />
    </div>
  );
}
