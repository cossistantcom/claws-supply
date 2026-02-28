"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelAdCampaign,
  createAdCampaign,
  getAdAvailability,
  getCurrentAdCampaign,
} from "./api";
import type { CreateAdCampaignInput } from "./schemas";

export const adsAvailabilityQueryKey = ["ads", "availability"] as const;
export const adsCampaignQueryKey = ["ads", "campaign"] as const;

export function useAdsAvailabilityQuery() {
  return useQuery({
    queryKey: adsAvailabilityQueryKey,
    queryFn: getAdAvailability,
  });
}

export function useCurrentAdCampaignQuery(enabled: boolean) {
  return useQuery({
    queryKey: adsCampaignQueryKey,
    queryFn: getCurrentAdCampaign,
    enabled,
  });
}

export function useCreateAdCampaignMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAdCampaignInput) => createAdCampaign(input),
    onSuccess: (result) => {
      queryClient.setQueryData(adsCampaignQueryKey, result.campaign);
      queryClient.invalidateQueries({
        queryKey: adsAvailabilityQueryKey,
      });
    },
  });
}

export function useCancelAdCampaignMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelAdCampaign,
    onSuccess: (result) => {
      queryClient.setQueryData(adsCampaignQueryKey, result.campaign);
      queryClient.invalidateQueries({
        queryKey: adsAvailabilityQueryKey,
      });
    },
  });
}

