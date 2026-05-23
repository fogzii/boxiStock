"use client";

import { Button } from "../button";

interface ModalActionsProps {
  submitLabel?: string;
  cancelLabel?: string;
  loadingLabel?: string;
  isLoading?: boolean;
  onCancel: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

export function ModalActions({
  submitLabel = "Save",
  cancelLabel = "Cancel",
  loadingLabel,
  isLoading = false,
  onCancel,
  destructive = false,
  disabled,
}: ModalActionsProps) {
  const isDisabled = isLoading || disabled;
  const label = isLoading ? (loadingLabel ?? `${submitLabel}...`) : submitLabel;

  return (
    <div className="flex flex-col gap-3 mt-2">
      <Button
        type="submit"
        disabled={isDisabled}
        variant={destructive ? "destructive" : "default"}
        className="w-full h-12 shadow-glow-subtle"
      >
        {label}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        className="w-full h-12"
      >
        {cancelLabel}
      </Button>
    </div>
  );
}
