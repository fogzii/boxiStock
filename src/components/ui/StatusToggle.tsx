"use client";

import { SegmentedControl } from "@box-ds";

interface StatusToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

export function StatusToggle({
  value: isStocked,
  onChange,
}: StatusToggleProps) {
  return (
    <SegmentedControl
      ariaLabel="Stock status"
      items={[
        { value: "stocked", label: "In Hand" },
        { value: "pending", label: "Pending" },
      ]}
      value={isStocked ? "stocked" : "pending"}
      onChange={(next) => onChange(next === "stocked")}
    />
  );
}
