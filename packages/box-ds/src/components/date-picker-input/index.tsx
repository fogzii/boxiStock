import type { DatePickerProps } from "react-date-picker";
import DatePicker from "react-date-picker";

import { cn } from "../../utils/cn";

function DatePickerInput({
  clearIcon = null,
  className,
  ...props
}: DatePickerProps) {
  return (
    <DatePicker
      clearIcon={clearIcon}
      className={cn(
        "w-full rounded-md border border-body bg-canvas text-body-sm [color-scheme:dark]",
        className,
      )}
      {...props}
    />
  );
}

export { DatePickerInput };
