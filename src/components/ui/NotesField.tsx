"use client";

import { Input } from "@box-ds";

const DEFAULT_MAX = 75;

interface NotesFieldProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  placeholder?: string;
}

export function NotesField({
  id,
  name,
  value,
  onChange,
  maxLength = DEFAULT_MAX,
  placeholder = "Add notes...",
}: NotesFieldProps) {
  return (
    <div className="relative">
      <Input
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        maxLength={maxLength}
        placeholder={placeholder}
        className="pr-14"
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground/40 tabular-nums pointer-events-none">
        {value.length}/{maxLength}
      </span>
    </div>
  );
}
