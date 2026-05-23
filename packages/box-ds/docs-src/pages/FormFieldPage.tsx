import { Button, CurrencyInput, FormField, Input, Label } from "@box-ds";
import { PageHeader, Section } from "../ComponentFrame";

export function FormFieldPage() {
  return (
    <div>
      <PageHeader
        title="Form field"
        description="Composes Label + hint text + any input child. Labels use Manrope 600, sentence-case."
      />

      <Section
        title="Basic fields"
        render={() => (
          <div className="flex flex-col gap-5">
            <FormField label="Full name" htmlFor="doc-name">
              <Input id="doc-name" placeholder="Your name" />
            </FormField>
            <FormField label="Email address" htmlFor="doc-email">
              <Input
                id="doc-email"
                type="email"
                placeholder="you@example.com"
              />
            </FormField>
            <FormField label="Notes" htmlFor="doc-notes" hint=" (optional)">
              <Input id="doc-notes" placeholder="Any additional notes" />
            </FormField>
          </div>
        )}
      />

      <Section
        title="Currency fields"
        render={() => (
          <div className="flex flex-col gap-5">
            <FormField label="Unit price" htmlFor="doc-price">
              <CurrencyInput id="doc-price" placeholder="0.00" />
            </FormField>
            <FormField label="Total value" htmlFor="doc-total">
              <CurrencyInput id="doc-total" defaultValue="1200.00" />
            </FormField>
          </div>
        )}
      />

      <Section
        title="Label standalone"
        description="Label used outside of FormField."
        render={() => (
          <div className="flex flex-col gap-2">
            <Label htmlFor="doc-standalone">Standalone label</Label>
            <Input id="doc-standalone" placeholder="With standalone label" />
          </div>
        )}
      />

      <Section
        title="Full form example"
        render={() => (
          <form
            className="flex flex-col gap-5"
            onSubmit={(e) => e.preventDefault()}
          >
            <FormField label="Product name" htmlFor="doc-pname">
              <Input id="doc-pname" placeholder="e.g. Widget Pro" />
            </FormField>
            <FormField
              label="SKU"
              htmlFor="doc-sku"
              hint=" (auto-generated if blank)"
            >
              <Input id="doc-sku" placeholder="WP-001" />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Cost price" htmlFor="doc-cost">
                <CurrencyInput id="doc-cost" placeholder="0.00" />
              </FormField>
              <FormField label="Sell price" htmlFor="doc-sell">
                <CurrencyInput id="doc-sell" placeholder="0.00" />
              </FormField>
            </div>
            <Button type="submit" className="h-12 w-full">
              Add product
            </Button>
          </form>
        )}
      />
    </div>
  );
}
