import { useState } from "react";
import { ActionsPage } from "./pages/ActionsPage";
import { InputsPage } from "./pages/InputsPage";
import { MiscPage } from "./pages/MiscPage";
import { SurfacesPage } from "./pages/SurfacesPage";
import { TokensPage } from "./pages/TokensPage";

const PAGES = [
  { id: "tokens", label: "Design tokens", Page: TokensPage },
  { id: "actions", label: "Actions", Page: ActionsPage },
  { id: "inputs", label: "Inputs & Fields", Page: InputsPage },
  { id: "surfaces", label: "Surfaces", Page: SurfacesPage },
  { id: "data", label: "Data & Feedback", Page: MiscPage },
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
          <div className="mt-1 text-caption text-muted-foreground">
            Component library
          </div>
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
        <div className="mx-auto max-w-[1200px]">
          <Page />
        </div>
      </main>
    </div>
  );
}
