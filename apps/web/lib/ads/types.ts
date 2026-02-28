export type AdPlacement = "sidebar" | "results" | "both";
export type AdCampaignStatus =
  | "checkout_pending"
  | "active"
  | "cancel_scheduled"
  | "ended"
  | "canceled"
  | "suspended_policy";

export type AdCampaignDTO = {
  id: string;
  advertiserUserId: string;
  companyName: string;
  websiteUrl: string;
  shortDescription: string;
  logoUrl: string;
  placement: AdPlacement;
  status: AdCampaignStatus;
  stripeSubscriptionStatus: string | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdAvailabilityDTO = {
  slotLimit: number;
  occupiedSlots: number;
  spotsLeft: number;
  pricing: {
    sidebar: number;
    results: number;
    both: number;
  };
  stripePriceIds: {
    environment: "sandbox" | "production";
    values: {
      sidebar: string;
      results: string;
      both: string;
    };
  };
};

export type CreateAdCampaignResponse = {
  campaign: AdCampaignDTO;
  checkoutUrl: string;
};

export type CancelAdCampaignResponse = {
  campaign: AdCampaignDTO;
};

export type RenderableAd = {
  id: string;
  companyName: string;
  websiteUrl: string;
  shortDescription: string;
  logoUrl: string;
  placement: AdPlacement;
};

