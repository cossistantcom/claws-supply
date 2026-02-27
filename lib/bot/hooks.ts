"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type Query,
} from "@tanstack/react-query";
import { deployBotRequest, fetchBotStatus } from "./client";
import type { BotStatusResponse } from "./types";
import { TERMINAL_BOT_STATUSES } from "./types";

const BOT_STATUS_QUERY_KEY = ["bot", "status"] as const;
const BOT_STATUS_POLL_MS = 2_500;

function resolveRefetchInterval(
  query: Query<BotStatusResponse, Error, BotStatusResponse, typeof BOT_STATUS_QUERY_KEY>,
) {
  const status = query.state.data?.status;
  if (!status) {
    return BOT_STATUS_POLL_MS;
  }

  return TERMINAL_BOT_STATUSES.has(status) ? false : BOT_STATUS_POLL_MS;
}

export function useBotStatusQuery() {
  return useQuery({
    queryKey: BOT_STATUS_QUERY_KEY,
    queryFn: fetchBotStatus,
    staleTime: 1_000,
    refetchInterval: resolveRefetchInterval,
    refetchOnWindowFocus: true,
  });
}

export function useDeployBotMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deployBotRequest,
    onSuccess: (data) => {
      queryClient.setQueryData(BOT_STATUS_QUERY_KEY, data);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: BOT_STATUS_QUERY_KEY,
      });
    },
  });
}

export { BOT_STATUS_QUERY_KEY };
