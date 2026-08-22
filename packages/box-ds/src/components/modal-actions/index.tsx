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
    // `flex-1` is deliberately `sm:`-only. Below that the row is a column, so
    // `flex: 1 1 0%` would apply to the *height* and override `h-12` - the
    // buttons collapsed to their ~26px content minimum. `w-full` already fills
    // the column, so there is nothing for `flex-1` to do there anyway.
    <div className="mt-2 flex flex-col gap-3 sm:flex-row-reverse">
      <Button
        type="submit"
        disabled={isDisabled}
        variant={destructive ? "destructive" : "default"}
        className="h-12 w-full shadow-glow-subtle sm:flex-1"
      >
        {label}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        className="h-12 w-full sm:flex-1"
      >
        {cancelLabel}
      </Button>
    </div>
  );
}
