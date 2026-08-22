"use client";

import * as React from "react";

import { cn } from "../../utils/cn";

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

// Two 0-9 runs stacked in one strip. A digit renders at its face in the first
// run (so the server-rendered HTML already reads correctly, before any JS) and
// then travels to the identical face in the second run - a full revolution
// that always rolls upward, whatever the digit is.
const STRIP = [...DIGITS, ...DIGITS];
const STRIP_STEP = 100 / STRIP.length;

export interface RollingNumberProps
  extends Omit<React.ComponentProps<"span">, "children"> {
  /**
   * The already-formatted figure, e.g. `"$1,234.56"` or `"12.3%"`. Digits roll;
   * every other character is painted in place.
   */
  value: string;
  /** How long one digit takes to travel. */
  durationMs?: number;
  /** Delay added per digit, left to right, so the roll lands as a wave. */
  staggerMs?: number;
  /** Ceiling on the accumulated stagger, so long figures still settle promptly. */
  maxStaggerMs?: number;
}

function RollingNumber({
  value,
  durationMs = 900,
  staggerMs = 55,
  maxStaggerMs = 330,
  className,
  ...props
}: RollingNumberProps) {
  // False for the first painted frame so the strip has a start position to
  // transition away from; flipped on afterwards and never reset - a later
  // `value` change then rolls from the digit on screen to the new one, the way
  // an odometer wheel turns.
  const [rolled, setRolled] = React.useState(false);

  React.useEffect(() => {
    let inner = 0;
    // Two frames: the start offset must be painted before the transition to
    // the landing offset is something the browser can animate.
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setRolled(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, []);

  const chars = Array.from(value);
  let digitIndex = -1;

  return (
    // `inline-flex`, so every character is a flex item of equal height rather
    // than an inline box. Digit slots have to clip their strip, and an
    // `overflow: hidden` inline-block takes its baseline from its bottom edge -
    // which would sit the rolling digits off the line the static `$` and `,`
    // sit on. As flex items they all share one box height instead.
    <span
      className={cn("inline-flex items-stretch tabular-nums", className)}
      {...props}
    >
      <span className="sr-only">{value}</span>

      <span aria-hidden="true" className="inline-flex items-stretch">
        {chars.map((char, index) => {
          const digit = DIGITS.indexOf(char);

          if (digit < 0) {
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: slots are positional - a stable key per position is what lets a wheel roll from the old digit to the new one instead of remounting
              <span key={index} className="whitespace-pre">
                {char}
              </span>
            );
          }

          digitIndex += 1;
          const offset = rolled ? digit + DIGITS.length : digit;
          const delay = Math.min(digitIndex * staggerMs, maxStaggerMs);

          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: positional by design - see above
            <span key={index} className="relative overflow-hidden">
              {/* Sizer: gives the slot one line-box of height and a digit of
                  width without painting anything. The strip floats over it. */}
              <span className="invisible">0</span>

              <span
                className="absolute inset-x-0 top-0 transition-transform ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                style={{
                  transform: `translateY(-${offset * STRIP_STEP}%)`,
                  transitionDuration: `${durationMs}ms`,
                  transitionDelay: `${delay}ms`,
                  willChange: rolled ? undefined : "transform",
                }}
              >
                {STRIP.map((stripDigit, stripIndex) => (
                  <span
                    // biome-ignore lint/suspicious/noArrayIndexKey: fixed 0-9-0-9 strip, no identity
                    key={stripIndex}
                    className="block"
                  >
                    {stripDigit}
                  </span>
                ))}
              </span>
            </span>
          );
        })}
      </span>
    </span>
  );
}

export { RollingNumber };
