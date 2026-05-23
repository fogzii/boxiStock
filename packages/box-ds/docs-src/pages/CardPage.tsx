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
} from "@box-ds";
import { PageHeader, Section } from "../ComponentFrame";

export function CardPage() {
  return (
    <div>
      <PageHeader
        title="Card"
        description="Surface container with 1px solid colors.ink border and canvas (#1a1a1a) background."
      />

      <Section
        title="Basic card"
        render={() => (
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
        )}
      />

      <Section
        title="Card with action"
        render={() => (
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
        )}
      />

      <Section
        title="Card with footer"
        render={() => (
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
        )}
      />

      <Section
        title="Small size"
        render={() => (
          <Card size="sm">
            <CardHeader>
              <CardTitle>Compact card</CardTitle>
              <CardDescription>Reduced padding for dense views</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="m-0 text-body-sm text-body">
                Content inside a size=sm card.
              </p>
            </CardContent>
          </Card>
        )}
      />
    </div>
  );
}
