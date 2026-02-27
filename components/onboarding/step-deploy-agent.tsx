"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PixelLoader } from "@/components/ui/pixel-loader";
import { useBotStatusQuery, useDeployBotMutation } from "@/lib/bot/hooks";
import type { BotStatus } from "@/lib/bot/types";

const STATUS_COPY: Record<BotStatus, string> = {
  not_deployed: "Your Clawbot is not deployed yet.",
  provisioning: "Creating your Railway service and preparing the runtime.",
  deploying: "Deployment in progress. This can take a minute.",
  live: "Your Clawbot is live.",
  failed: "Deployment failed. Retry to redeploy the same service.",
  deleting: "Subscription is inactive. Cleaning up the Railway service.",
  deleted: "Your previous deployment was removed. You can deploy again.",
};

export function StepDeployAgent() {
  const router = useRouter();
  const botStatus = useBotStatusQuery();
  const deployMutation = useDeployBotMutation();

  const status = botStatus.data?.status ?? "not_deployed";
  const successUrl = botStatus.data?.successUrl ?? null;
  const isDeploying = status === "provisioning" || status === "deploying";
  const canDeploy =
    status === "not_deployed" || status === "deleted" || status === "failed";
  const deployError = deployMutation.error?.message ?? botStatus.error?.message;

  const actionLabel = status === "failed" ? "RETRY DEPLOY" : "DEPLOY BOT";

  const handleDeploy = () => {
    if (!canDeploy || deployMutation.isPending) {
      return;
    }

    deployMutation.mutate();
  };

  return (
    <div className="max-w-sm w-full mx-auto text-center">
      <div className="mb-8">
        <p className="font-pixel text-4xl mb-6">&gt;_</p>
        <h1 className="font-pixel text-2xl sm:text-3xl mb-4">
          DEPLOY YOUR CLAWBOT.
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
          {STATUS_COPY[status]}
        </p>
      </div>

      <div className="space-y-4 mb-10 max-w-xs mx-auto">
        {(isDeploying || deployMutation.isPending) && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <PixelLoader size={14} ariaLabel="Deployment in progress" />
            <span>Tracking deployment...</span>
          </div>
        )}

        {deployError && (
          <div className="border border-destructive/50 bg-destructive/10 text-destructive text-xs px-3 py-2 rounded-none">
            {deployError}
          </div>
        )}

        {status === "live" && successUrl && (
          <Link
            href={successUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center w-full h-11 border border-border text-xs font-pixel tracking-wider hover:bg-muted transition-colors"
          >
            OPEN LIVE BOT
          </Link>
        )}

        <Button
          size="lg"
          onClick={handleDeploy}
          className="font-pixel text-xs tracking-wider px-10 h-12 w-full"
          disabled={!canDeploy || deployMutation.isPending || isDeploying}
        >
          {isDeploying || deployMutation.isPending ? "DEPLOYING..." : actionLabel}
        </Button>
      </div>

      <Button
        size="lg"
        onClick={() => {
          router.push("/dashboard");
        }}
        className="font-pixel text-xs tracking-wider px-10 h-12 w-full"
      >
        GO TO DASHBOARD
      </Button>
    </div>
  );
}
