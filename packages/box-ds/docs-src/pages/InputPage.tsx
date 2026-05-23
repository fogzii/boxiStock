import { CurrencyInput, Input } from "@box-ds";
import { PageHeader, Section } from "../ComponentFrame";

export function InputPage() {
  return (
    <div>
      <PageHeader
        title="Input"
        description="Text input with 1px solid colors.body border, 12px radius, and solid canvas-soft background."
      />

      <Section
        title="Default states"
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

      <Section
        title="Currency input"
        description="Wraps Input with a currency symbol prefix."
        render={() => (
          <div className="flex flex-col gap-3">
            <CurrencyInput placeholder="0.00" />
            <CurrencyInput symbol="€" placeholder="0.00" />
            <CurrencyInput symbol="£" placeholder="0.00" disabled />
          </div>
        )}
      />
    </div>
  );
}
