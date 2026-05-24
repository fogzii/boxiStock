import {
  Button,
  CurrencyInput,
  FormField,
  Input,
  Label,
  SearchInput,
} from "@box-ds";
import { GroupHeading, PageHeader, Section } from "../ComponentFrame";

export function InputsPage() {
  return (
    <div>
      <PageHeader
        title="Inputs & Fields"
        description="Text inputs, search, currency fields, and form composition helpers."
      />

      {/* ── Text input ── */}
      <GroupHeading>Text input</GroupHeading>

      <Section
        title="Default states"
        description="Default height is 36px (h-9). Width fills its container — constrain via the parent."
        render={() => (
          <div className="flex flex-col gap-3">
            <Input placeholder="Placeholder text" />
            <Input defaultValue="Filled value" />
            <Input disabled placeholder="Disabled" />
          </div>
        )}
      />

      <Section
        title="Types"
        render={() => (
          <div className="flex flex-col gap-3">
            <Input type="email" placeholder="you@example.com" />
            <Input type="number" placeholder="0" min={0} step={0.01} />
            <Input type="password" placeholder="Password" />
          </div>
        )}
      />

      {/* ── Search input ── */}
      <GroupHeading>Search input</GroupHeading>

      <Section
        title="Default"
        description="Default width is w-96 (384px). Override with containerClassName."
        render={() => <SearchInput placeholder="Search products or lots…" />}
      />

      <Section
        title="Pending / loading"
        description="Pass isPending to pulse the search icon while a transition is in-flight."
        render={() => <SearchInput placeholder="Searching…" isPending />}
      />

      <Section
        title="Custom width"
        description="Use containerClassName to override the default w-96."
        render={() => (
          <div className="flex flex-col gap-3">
            <SearchInput
              placeholder="Narrow — w-48"
              containerClassName="w-48"
            />
            <SearchInput placeholder="Default — w-96" />
            <SearchInput placeholder="Full width" containerClassName="w-full" />
          </div>
        )}
      />

      {/* ── Currency input ── */}
      <GroupHeading>Currency input</GroupHeading>

      <Section
        title="Currency variants"
        description="Wraps Input with a left-aligned currency symbol. Default symbol is $."
        render={() => (
          <div className="flex flex-col gap-3">
            <CurrencyInput placeholder="0.00" />
            <CurrencyInput symbol="€" placeholder="0.00" />
            <CurrencyInput symbol="£" placeholder="0.00" disabled />
          </div>
        )}
      />

      {/* ── Form field ── */}
      <GroupHeading>Form field</GroupHeading>

      <Section
        title="Basic fields"
        description="Composes Label + optional hint text + any input child."
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
