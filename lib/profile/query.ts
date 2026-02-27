"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  connectStripeAccount,
  connectXAccount,
  deleteCurrentAccount,
  getProfile,
  refreshStripeStatus,
  updateProfile,
} from "./api";

export const profileQueryKey = ["profile"] as const;

export function useProfileQuery() {
  return useQuery({
    queryKey: profileQueryKey,
    queryFn: getProfile,
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (nextProfile) => {
      queryClient.setQueryData(profileQueryKey, nextProfile);
    },
  });
}

export function useConnectXMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: connectXAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: profileQueryKey,
      });
    },
  });
}

export function useConnectStripeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: connectStripeAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: profileQueryKey,
      });
    },
  });
}

export function useRefreshStripeStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: refreshStripeStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: profileQueryKey,
      });
    },
  });
}

export function useDeleteAccountMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCurrentAccount,
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

