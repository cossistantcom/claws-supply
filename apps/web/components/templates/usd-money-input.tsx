"use client";

import CurrencyInput from "react-currency-input-field";
import { centsToUsdInputValue, usdInputValueToCents } from "@/lib/money";
import { cn } from "@/lib/utils";

type UsdMoneyInputProps = {
  id?: string;
  name?: string;
  valueCents: number;
  disabled?: boolean;
  className?: string;
  onValueCentsChange: (valueCents: number) => void;
};

export function UsdMoneyInput({
  id,
  name,
  valueCents,
  disabled = false,
  className,
  onValueCentsChange,
}: UsdMoneyInputProps) {
  return (
    <CurrencyInput
      id={id}
      name={name}
      value={centsToUsdInputValue(valueCents)}
      decimalsLimit={2}
      decimalScale={2}
      fixedDecimalLength={2}
      allowNegativeValue={false}
      prefix="$"
      disabled={disabled}
      placeholder="0.00"
      onValueChange={(value) => {
        onValueCentsChange(usdInputValueToCents(value));
      }}
      className={cn(
        "dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 disabled:bg-input/50 dark:disabled:bg-input/80 h-8 rounded-none border bg-transparent px-2.5 py-1 text-sm transition-colors focus-visible:ring-1 aria-invalid:ring-1 md:text-sm placeholder:text-muted-foreground w-full min-w-0 outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    />
  );
}
