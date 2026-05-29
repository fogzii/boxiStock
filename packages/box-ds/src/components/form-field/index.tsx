import type * as React from "react";
import { cn } from "../../utils/cn";
import { Label } from "../label";

interface FormFieldProps {
  label: React.ReactNode;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
  error?: string;
}

export function FormField({
  label,
  htmlFor,
  hint,
  children,
  className,
  error,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={htmlFor} className={cn(error && "text-negative")}>
        {label}
        {hint && <span className="text-body-sm text-body/70">{hint}</span>}
      </Label>
      {children}
      {error && <p className="text-body-sm text-negative">{error}</p>}
    </div>
  );
}
