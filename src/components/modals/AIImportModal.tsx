"use client";

import { FormField, Modal, ModalActions } from "@box-ds";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { parseInventoryWithAI, parseSalesWithAI } from "@/actions/ai";
import { type ImportType, useAIImport } from "@/context/AIImportContext";
import { cn } from "@/lib/utils";

const schema = z.object({
  prompt: z.string().min(1, "Description is required"),
});

type FormData = z.infer<typeof schema>;

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
  const [savedTexts, setSavedTexts] = React.useState<
    Record<ImportType, string>
  >({
    stock: "",
    sales: "",
  });
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    getValues,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: { prompt: "" },
  });

  const { setImportData, importData } = useAIImport();
  const router = useRouter();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    if (searchParams.get("reopen-ai") === "true") {
      setIsOpen(true);
      router.replace("/stock", { scroll: false });
    }
  }, [searchParams, router]);

  React.useEffect(() => {
    if (isOpen && importData?.prompt) {
      setSavedTexts((prev) => ({
        ...prev,
        [importData.type]: importData.prompt,
      }));
      setImportType(importData.type);
      setValue("prompt", importData.prompt);
    }
  }, [isOpen, importData, setValue]);

  function handleImportTypeChange(type: ImportType) {
    setSavedTexts((prev) => ({ ...prev, [importType]: getValues("prompt") }));
    setImportType(type);
    setValue("prompt", savedTexts[type]);
  }

  const onSubmit = handleSubmit(async (data) => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      if (importType === "stock") {
        const result = await parseInventoryWithAI(data.prompt);
        if (!result.ok) {
          setErrorMsg(result.error);
          return;
        }
        setImportData({
          type: "stock",
          prompt: data.prompt,
          stockLots: result.data as never,
          sales: [],
        });
        posthog.capture("ai_import_generated", {
          import_type: "stock",
          items_parsed: (result.data as unknown[]).length,
        });
      } else {
        const result = await parseSalesWithAI(data.prompt);
        if (!result.ok) {
          setErrorMsg(result.error);
          return;
        }
        setImportData({
          type: "sales",
          prompt: data.prompt,
          stockLots: [],
          sales: result.data as never,
        });
        posthog.capture("ai_import_generated", {
          import_type: "sales",
          items_parsed: (result.data as unknown[]).length,
        });
      }

      setSavedTexts({ stock: "", sales: "" });
      reset();
      setIsOpen(false);
      onAfterGenerate?.();
      router.push("/stock/ai-import");
    } catch (error) {
      console.error("AI Parsing Error:", error);
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  });

  function handleClose() {
    reset();
    setSavedTexts({ stock: "", sales: "" });
    setIsOpen(false);
  }

  return (
    <>
      {children(() => setIsOpen(true))}
      <Modal isOpen={isOpen} onClose={handleClose} title="Add with AI (Beta)">
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
          {errorMsg && (
            <div className="bg-negative-surface border border-negative/20 text-negative text-body-sm p-3 rounded-lg flex items-center gap-2">
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
            <div className="flex p-1 bg-background/50 border border-primary/20 rounded-lg">
              <button
                type="button"
                onClick={() => handleImportTypeChange("stock")}
                className={cn(
                  "flex-1 py-2 text-body-sm-strong rounded-md transition-all cursor-pointer",
                  importType === "stock"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Stock Inventory
              </button>
              <button
                type="button"
                onClick={() => handleImportTypeChange("sales")}
                className={cn(
                  "flex-1 py-2 text-body-sm-strong rounded-md transition-all cursor-pointer",
                  importType === "sales"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Sales History
              </button>
            </div>

            <FormField
              label={
                importType === "stock"
                  ? "Describe the products and lots you purchased"
                  : "Describe the products and quantities you sold"
              }
              htmlFor="prompt"
              error={undefined}
            >
              <textarea
                id="prompt"
                rows={6}
                placeholder={
                  importType === "stock" ? "I bought..." : "I sold..."
                }
                className={cn(
                  "w-full bg-background/50 border border-primary/20 rounded-md p-3 text-body-sm focus-visible:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none placeholder:text-muted-foreground",
                  errors.prompt && "border-negative ring-2 ring-negative/20",
                )}
                {...register("prompt")}
              />
            </FormField>
            <p className="text-caption text-muted-foreground">
              Parsing and extracting the necessary fields will be done by the
              AI.
            </p>
          </div>

          <ModalActions
            submitLabel="Generate"
            loadingLabel="Generating..."
            isLoading={isSubmitting}
            onCancel={handleClose}
          />
        </form>
      </Modal>
    </>
  );
}
