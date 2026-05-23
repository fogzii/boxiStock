import { useState } from "react";
import { BadgePage } from "./pages/BadgePage";
import { ButtonPage } from "./pages/ButtonPage";
import { CardPage } from "./pages/CardPage";
import { FormFieldPage } from "./pages/FormFieldPage";
import { InputPage } from "./pages/InputPage";
import { MiscPage } from "./pages/MiscPage";
import { ModalPage } from "./pages/ModalPage";
import { TokensPage } from "./pages/TokensPage";

const PAGES = [
  { id: "tokens", label: "Design tokens", Page: TokensPage },
  { id: "button", label: "Button", Page: ButtonPage },
  { id: "input", label: "Input", Page: InputPage },
  { id: "card", label: "Card", Page: CardPage },
  { id: "badge", label: "Badge", Page: BadgePage },
  { id: "form-field", label: "Form field", Page: FormFieldPage },
  { id: "modal", label: "Modal", Page: ModalPage },
  { id: "misc", label: "Skeleton · Table · Tooltip", Page: MiscPage },
] as const;

type PageId = (typeof PAGES)[number]["id"];

export default function App() {
  const [active, setActive] = useState<PageId>("tokens");
  const Page = PAGES.find((p) => p.id === active)?.Page ?? PAGES[0].Page;

  return (
    <div className="flex h-dvh overflow-hidden bg-canvas-soft text-ink">
      <aside className="flex w-[240px] shrink-0 flex-col overflow-hidden border-r border-border bg-canvas">
        <div className="border-b border-border px-5 py-5">
          <div className="font-display text-display-xs tracking-tight text-ink">
            box-ds
          </div>
          <div className="mt-1 text-caption text-mute">Component library</div>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          {PAGES.map((p) => {
            const isActive = p.id === active;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActive(p.id)}
                className={`block w-full cursor-pointer rounded-md px-3 py-2 text-left text-body-sm transition-colors ${
                  isActive
                    ? "bg-primary-pale text-ink font-semibold"
                    : "text-body hover:bg-primary-pale/40 hover:text-ink"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </nav>
        <div className="border-t border-border px-4 py-3 text-caption text-mute">
          v0.1.0
        </div>
      </aside>

      <main className="flex-1 overflow-auto px-12 py-10">
        <Page />
      </main>
    </div>
  );
}
