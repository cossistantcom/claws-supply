export function formatUsdFromCents(priceCents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(priceCents / 100);
}

export function centsToUsdInputValue(priceCents: number): string {
  return (priceCents / 100).toFixed(2);
}

export function usdInputValueToCents(value: string | number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const normalized =
    typeof value === "number"
      ? String(value)
      : value.replace(/[^0-9.]/g, "").trim();

  if (!normalized) {
    return 0;
  }

  const numeric = Number(normalized);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return 0;
  }

  return Math.round((numeric + Number.EPSILON) * 100);
}
