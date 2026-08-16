"use client";

import { CountedInput } from "@box-ds";

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
    <CountedInput
      id={id}
      name={name}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      maxLength={maxLength}
      placeholder={placeholder}
    />
  );
}
