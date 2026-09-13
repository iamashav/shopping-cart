"use client";

import { MinusIcon, PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type QuantityStepperProps = {
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
  className?: string;
};

export function QuantityStepper({
  value,
  min = 1,
  max,
  onChange,
  label,
  className,
}: QuantityStepperProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("inline-flex h-10 items-center rounded-lg border bg-card", className)}
    >
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label="Decrease quantity"
        className="flex size-10 items-center justify-center rounded-l-lg hover:bg-muted disabled:opacity-40"
      >
        <MinusIcon className="size-4" />
      </button>
      <span className="w-8 text-center text-sm tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="Increase quantity"
        className="flex size-10 items-center justify-center rounded-r-lg hover:bg-muted disabled:opacity-40"
      >
        <PlusIcon className="size-4" />
      </button>
    </div>
  );
}
