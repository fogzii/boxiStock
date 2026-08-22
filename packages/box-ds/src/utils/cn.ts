import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// tailwind-merge only knows Tailwind's stock font-size scale (`text-sm`,
// `text-2xl`, ...). Every other `text-*` it assumes is a colour - so it read
// our design-system sizes as colours and dropped them whenever a real colour
// followed, e.g. `text-button-md ... text-primary-foreground` on the default
// Button variant, which silently lost the button's 600 weight. Naming the
// scale here puts each one back in the font-size group, where it conflicts
// only with other sizes.
//
// Keep in step with the `--text-*` tokens in `styles.css`.
const FONT_SIZES = [
  "display-mega",
  "display-xxl",
  "display-xl",
  "display-lg",
  "display-md",
  "display-sm",
  "display-xs",
  "body-lg",
  "body-md",
  "body-md-strong",
  "body-sm",
  "body-sm-strong",
  "caption",
  "badge",
  "button-md",
];

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: FONT_SIZES }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
