export const DEFAULT_PLATFORM_COMMISSION_RATE = {
  direct: 20,
  browsing: 30,
} as const;

export const DIRECT_REFERRAL_WINDOW_DAYS = 90;

export type TemplateSaleType = keyof typeof DEFAULT_PLATFORM_COMMISSION_RATE;

export function calculateTemplateCommissionSplit(
  priceCents: number,
  saleType: TemplateSaleType,
) {
  const commissionRate = DEFAULT_PLATFORM_COMMISSION_RATE[saleType];
  const platformFeeCents = Math.round((priceCents * commissionRate) / 100);
  const sellerPayoutCents = Math.max(0, priceCents - platformFeeCents);

  return {
    commissionRate,
    platformFeeCents,
    sellerPayoutCents,
  };
}
