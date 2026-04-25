"use client";

import { useRouter, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import * as React from "react";
import { parseInventoryWithAI, parseSalesWithAI } from "@/actions/ai";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { type ImportType, useAIImport } from "@/context/AIImportContext";
import { cn } from "@/lib/utils";

export function AIImportModal({
  children,
  onAfterGenerate,
}: {
  children: (open: () => void) => React.ReactNode;
  onAfterGenerate?: () => void;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [importType, setImportType] = React.useState<ImportType>("stock");
  const [promptTexts, setPromptTexts] = React.useState<
    Record<ImportType, string>
  >({ stock: "", sales: "" });
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const promptText = promptTexts[importType];
  const setPromptText = (value: string) =>
    setPromptTexts((prev) => ({ ...prev, [importType]: value }));

  const { setImportData, importData } = useAIImport();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle restoring prompt if returning from Try Again
  React.useEffect(() => {
    if (searchParams.get("reopen-ai") === "true") {
      setIsOpen(true);
      router.replace("/stock", { scroll: false });
    }
  }, [searchParams, router]);

  React.useEffect(() => {
    if (isOpen && importData?.prompt) {
      setPromptTexts((prev) => ({
        ...prev,
        [importData.type]: importData.prompt,
      }));
      setImportType(importData.type);
    }
  }, [isOpen, importData]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!promptText.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      if (importType === "stock") {
        const result = await parseInventoryWithAI(promptText);
        if (!result.ok) {
          setErrorMsg(result.error);
          return;
        }
        setImportData({
          type: "stock",
          prompt: promptText,
          stockLots: result.data as never,
          sales: [],
        });
        posthog.capture("ai_import_generated", {
          import_type: "stock",
          items_parsed: (result.data as unknown[]).length,
        });
      } else {
        const result = await parseSalesWithAI(promptText);
        if (!result.ok) {
          setErrorMsg(result.error);
          return;
        }
        setImportData({
          type: "sales",
          prompt: promptText,
          stockLots: [],
          sales: result.data as never,
        });
        posthog.capture("ai_import_generated", {
          import_type: "sales",
          items_parsed: (result.data as unknown[]).length,
        });
      }

      setPromptTexts({ stock: "", sales: "" });
      setIsOpen(false);
      onAfterGenerate?.();
      router.push("/stock/ai-import");
    } catch (error) {
      // Fallback for truly unexpected errors (network failures, etc.)
      console.error("AI Parsing Error:", error);
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {children(() => setIsOpen(true))}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Add with AI (Beta)"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                role="img"
                aria-label="Error"
              >
                <title>Error</title>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {errorMsg}
            </div>
          )}
          <div className="space-y-4">
            {/* Import Type Tabs */}
            <div className="flex p-1 bg-background/50 border border-primary/20 rounded-lg">
              <button
                type="button"
                onClick={() => setImportType("stock")}
                className={cn(
                  "flex-1 py-2 text-sm font-bold rounded-md transition-all cursor-pointer",
                  importType === "stock"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Stock Manager
              </button>
              <button
                type="button"
                onClick={() => setImportType("sales")}
                className={cn(
                  "flex-1 py-2 text-sm font-bold rounded-md transition-all cursor-pointer",
                  importType === "sales"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Sales History
              </button>
            </div>

            {/* Prompt input */}
            <div className="space-y-2">
              <Label htmlFor="prompt" className="text-muted-foreground">
                {importType === "stock"
                  ? "Describe the products and lots you purchased"
                  : "Describe the products and quantities you sold"}
              </Label>
              <textarea
                id="prompt"
                name="prompt"
                rows={6}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder={
                  importType === "stock" ? "I bought..." : "I sold..."
                }
                required
                className="w-full bg-background/50 border border-primary/20 rounded-md p-3 text-sm focus-visible:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none placeholder:text-muted-foreground"
              />
            </div>
            <p className="text-[13px] text-muted-foreground">
              Parsing and extracting the necessary fields will be done by the
              AI.
            </p>
          </div>

          <div className="flex flex-col gap-3 mt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 cursor-pointer text-sm rounded-lg"
            >
              {isSubmitting ? "Generating..." : "Generate"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="w-full h-12 cursor-pointer text-sm rounded-lg hover:bg-white/5"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
