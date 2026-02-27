"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PixelLoader } from "@/components/ui/pixel-loader";
import { useBotStatusQuery, useDeployBotMutation } from "@/lib/bot/hooks";
import type { BotStatus } from "@/lib/bot/types";

const STATUS_LABELS: Record<BotStatus, string> = {
  not_deployed: "Not deployed",
  provisioning: "Provisioning",
  deploying: "Deploying",
  live: "Live",
  failed: "Failed",
  deleting: "Deleting",
  deleted: "Deleted",
};

export function BotDeployPanel() {
  const botStatus = useBotStatusQuery();
  const deployMutation = useDeployBotMutation();

  const status = botStatus.data?.status ?? "not_deployed";
  const successUrl = botStatus.data?.successUrl ?? null;
  const canDeploy =
    status === "not_deployed" || status === "deleted" || status === "failed";
  const isDeploying = status === "provisioning" || status === "deploying";
  const errorMessage = deployMutation.error?.message ?? botStatus.error?.message;

  return (
    <Card className="w-full max-w-xl border border-border">
      <CardHeader className="border-b border-border">
        <CardTitle className="font-pixel tracking-wider text-sm">
          CLAWBOT DEPLOYMENT
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <p className="font-pixel text-[10px] text-muted-foreground tracking-wider mb-1">
              STATUS
            </p>
            <p className="font-pixel text-sm uppercase">{STATUS_LABELS[status]}</p>
          </div>

          <div>
            <p className="font-pixel text-[10px] text-muted-foreground tracking-wider mb-1">
              DEPLOYMENT LINK
            </p>
            {successUrl ? (
              <Link
                href={successUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs underline underline-offset-2 break-all"
              >
                {successUrl}
              </Link>
            ) : (
              <p className="font-pixel text-sm">NOT AVAILABLE</p>
            )}
          </div>
        </div>

        {isDeploying && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <PixelLoader size={14} ariaLabel="Deployment in progress" />
            <span>Tracking Railway deployment...</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 border border-red-500/30 bg-red-500/5 text-red-400 text-[11px] font-pixel tracking-wider">
            {errorMessage}
          </div>
        )}

        <Button
          onClick={() => {
            deployMutation.mutate();
          }}
          size="lg"
          className="font-pixel text-xs tracking-wider h-11"
          disabled={!canDeploy || deployMutation.isPending || isDeploying}
        >
          {deployMutation.isPending || isDeploying
            ? "DEPLOYING..."
            : status === "failed"
              ? "RETRY DEPLOY"
              : "DEPLOY BOT"}
        </Button>
      </CardContent>
    </Card>
  );
}
