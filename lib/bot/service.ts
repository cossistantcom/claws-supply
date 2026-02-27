import { auth } from "@/lib/auth-server";
import {
  getOrganizationSubscriptions,
  hasActiveOrTrialingSubscription,
  resolveActiveOrganizationId,
} from "@/lib/billing/subscription-state";
import { getRailwayConfig, isBotDeployEnabled } from "@/lib/config";
import {
  createRailwayServiceFromImage,
  deleteRailwayService,
  deployRailwayService,
  getLatestRailwayDeploymentForService,
  getRailwayDeployment,
  updateRailwayServiceImage,
  upsertRailwayServiceVariables,
} from "@/lib/railway/operations";
import { mapRailwayStatusToBotStatus } from "@/lib/railway/status-map";
import { RailwayApiError } from "@/lib/railway/client";
import {
  clearDeletedMarkerIfActive,
  createBotRecord,
  getBotByOrganizationId,
  markBotDeleted,
  markBotDeleting,
  markBotDeploying,
  markBotFailure,
  markBotProvisioning,
  setBotServiceDetails,
  updateBotDeploymentState,
  withBotInstanceLock,
  type BotInstanceRecord,
} from "./repository";
import type { BotStatusResponse, DeployBotAction, DeployBotResponse } from "./types";
import { db } from "@/lib/db";

const STALE_SYNC_MS = 120_000;

function toErrorMessage(error: unknown): string {
  if (error instanceof RailwayApiError) {
    if (error.details) {
      return `${error.message} ${error.details}`.trim();
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Unknown error";
}

export class BotServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "BotServiceError";
    this.statusCode = statusCode;
  }
}

interface BotAuthContext {
  organizationId: string;
  subscriptionActive: boolean;
}

export interface DeployRailwayOps {
  createRailwayServiceFromImage: typeof createRailwayServiceFromImage;
  updateRailwayServiceImage: typeof updateRailwayServiceImage;
  upsertRailwayServiceVariables: typeof upsertRailwayServiceVariables;
  deployRailwayService: typeof deployRailwayService;
}

const DEFAULT_DEPLOY_RAILWAY_OPS: DeployRailwayOps = {
  createRailwayServiceFromImage,
  updateRailwayServiceImage,
  upsertRailwayServiceVariables,
  deployRailwayService,
};

async function requireBotAuthContext(requestHeaders: Headers): Promise<BotAuthContext> {
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session?.session || !session.user?.id) {
    throw new BotServiceError("Authentication required.", 401);
  }

  const organizationId = await resolveActiveOrganizationId({
    userId: session.user.id,
    sessionActiveOrganizationId: session.session.activeOrganizationId,
  });

  if (!organizationId) {
    throw new BotServiceError("No active organization found.", 403);
  }

  const subscriptions = await getOrganizationSubscriptions(organizationId);

  return {
    organizationId,
    subscriptionActive: hasActiveOrTrialingSubscription(subscriptions),
  };
}

function toStatusResponse(
  record: BotInstanceRecord | null,
  subscriptionActive: boolean,
): BotStatusResponse {
  if (!record) {
    return {
      status: "not_deployed",
      serviceId: null,
      deploymentId: null,
      successUrl: null,
      lastError: null,
      updatedAt: new Date().toISOString(),
      subscriptionActive,
    };
  }

  return {
    status: record.status as BotStatusResponse["status"],
    serviceId: record.railwayServiceId,
    deploymentId: record.railwayDeploymentId,
    successUrl: record.successUrl,
    lastError: record.lastError,
    updatedAt: record.updatedAt.toISOString(),
    subscriptionActive,
  };
}

function createServiceName(organizationId: string): string {
  const sanitized = organizationId.toLowerCase().replace(/[^a-z0-9-]/g, "");
  const trimmed = sanitized.slice(0, 18) || "org";
  return `clawbot-${trimmed}-${crypto.randomUUID().slice(0, 6)}`;
}

function buildServiceVariables(input: {
  organizationId: string;
  botId: string;
}): Record<string, string> {
  return {
    HOURGLASS_ORGANIZATION_ID: input.organizationId,
    HOURGLASS_BOT_ID: input.botId,
  };
}

function shouldSyncStatus(record: BotInstanceRecord): boolean {
  if (record.status === "provisioning" || record.status === "deploying") {
    return true;
  }

  const updatedAtMs = record.updatedAt.getTime();
  if (Number.isNaN(updatedAtMs)) {
    return false;
  }

  return Date.now() - updatedAtMs >= STALE_SYNC_MS && !!record.railwayDeploymentId;
}

export function resolveDeployAction(record: BotInstanceRecord): DeployBotAction {
  if (record.status === "live" && !!record.railwayServiceId) {
    return "already_live";
  }

  if (record.status === "provisioning" || record.status === "deploying") {
    return "already_in_progress";
  }

  if (record.railwayServiceId) {
    return "redeploying";
  }

  return "created_and_deploying";
}

export async function executeRailwayDeployAction(
  input: {
    action: Exclude<DeployBotAction, "already_live" | "already_in_progress">;
    context: Pick<BotAuthContext, "organizationId">;
    botRecord: BotInstanceRecord;
    railwayConfig: ReturnType<typeof getRailwayConfig>;
  },
  operations: DeployRailwayOps = DEFAULT_DEPLOY_RAILWAY_OPS,
  callbacks: {
    persistCreatedServiceDetails?: (input: {
      organizationId: string;
      serviceId: string;
      serviceName: string;
    }) => Promise<void>;
  } = {},
): Promise<{ deploymentId: string | null }> {
  let serviceId = input.botRecord.railwayServiceId;

  if (input.action === "created_and_deploying" || !serviceId) {
    const created = await operations.createRailwayServiceFromImage(
      input.railwayConfig,
      {
        serviceName: createServiceName(input.context.organizationId),
        imageRef: input.railwayConfig.botImage,
      },
    );

    serviceId = created.id;

    if (callbacks.persistCreatedServiceDetails) {
      await callbacks.persistCreatedServiceDetails({
        organizationId: input.context.organizationId,
        serviceId: created.id,
        serviceName: created.name,
      });
    } else {
      await setBotServiceDetails(db, input.context.organizationId, {
        serviceId: created.id,
        serviceName: created.name,
      });
    }
  }

  await operations.updateRailwayServiceImage(input.railwayConfig, {
    serviceId,
    imageRef: input.railwayConfig.botImage,
  });

  await operations.upsertRailwayServiceVariables(input.railwayConfig, {
    serviceId,
    variables: buildServiceVariables({
      organizationId: input.context.organizationId,
      botId: input.botRecord.id,
    }),
  });

  const deployment = await operations.deployRailwayService(input.railwayConfig, {
    serviceId,
  });

  return {
    deploymentId: deployment.deploymentId,
  };
}

async function ensureDeletedForInactiveSubscription(
  context: BotAuthContext,
): Promise<BotStatusResponse> {
  const botRecord = await getBotByOrganizationId(context.organizationId);
  if (!botRecord) {
    return toStatusResponse(null, false);
  }

  if (botRecord.status === "deleted") {
    return toStatusResponse(botRecord, false);
  }

  const railwayConfig = getRailwayConfig();
  let latestRecord = await markBotDeleting(db, context.organizationId);

  try {
    if (botRecord.railwayServiceId) {
      await deleteRailwayService(railwayConfig, {
        serviceId: botRecord.railwayServiceId,
      });
    }

    latestRecord = await markBotDeleted(db, context.organizationId);
  } catch (error) {
    latestRecord = await markBotFailure(
      db,
      context.organizationId,
      `Delete failed: ${toErrorMessage(error)}`,
    );
  }

  return toStatusResponse(latestRecord, false);
}
async function syncBotStatus(record: BotInstanceRecord): Promise<BotInstanceRecord> {
  if (!shouldSyncStatus(record)) {
    return record;
  }

  const railwayConfig = getRailwayConfig();
  const deployment = record.railwayDeploymentId
    ? await getRailwayDeployment(railwayConfig, {
        deploymentId: record.railwayDeploymentId,
      })
    : record.railwayServiceId
      ? await getLatestRailwayDeploymentForService(railwayConfig, {
          serviceId: record.railwayServiceId,
        })
      : null;

  if (!deployment) {
    return record;
  }

  return updateBotDeploymentState(db, record.organizationId, {
    deploymentId: deployment.id,
    status: mapRailwayStatusToBotStatus(deployment.status),
    lastRailwayStatus: deployment.status,
    successUrl: deployment.staticUrl ?? deployment.url,
  });
}

export async function getBotStatus(requestHeaders: Headers): Promise<BotStatusResponse> {
  if (!isBotDeployEnabled()) {
    throw new BotServiceError("Bot deployment is disabled.", 503);
  }

  const context = await requireBotAuthContext(requestHeaders);
  if (!context.subscriptionActive) {
    return ensureDeletedForInactiveSubscription(context);
  }

  const botRecord = await getBotByOrganizationId(context.organizationId);
  if (!botRecord) {
    return toStatusResponse(null, true);
  }

  try {
    const synced = await syncBotStatus(botRecord);
    return toStatusResponse(synced, true);
  } catch (error) {
    const failed = await markBotFailure(
      db,
      context.organizationId,
      toErrorMessage(error),
    );
    return toStatusResponse(failed, true);
  }
}

export async function deployBot(requestHeaders: Headers): Promise<DeployBotResponse> {
  if (!isBotDeployEnabled()) {
    throw new BotServiceError("Bot deployment is disabled.", 503);
  }

  const context = await requireBotAuthContext(requestHeaders);

  if (!context.subscriptionActive) {
    const inactiveStatus = await ensureDeletedForInactiveSubscription(context);
    return {
      action: "already_in_progress",
      ...inactiveStatus,
    };
  }

  const railwayConfig = getRailwayConfig();

  const lockOutcome = await withBotInstanceLock(context.organizationId, async (tx) => {
    let botRecord = await getBotByOrganizationId(context.organizationId, tx);
    if (!botRecord) {
      botRecord = await createBotRecord(tx, {
        organizationId: context.organizationId,
        railwayProjectId: railwayConfig.projectId,
        railwayEnvironmentId: railwayConfig.environmentId,
        imageRef: railwayConfig.botImage,
        status: "not_deployed",
      });
    }

    await clearDeletedMarkerIfActive(tx, context.organizationId);

    const action = resolveDeployAction(botRecord);
    if (action === "already_live" || action === "already_in_progress") {
      return {
        action,
        botRecord,
      };
    }

    botRecord = await markBotProvisioning(tx, context.organizationId, {
      imageRef: railwayConfig.botImage,
    });

    return {
      action,
      botRecord,
    };
  });

  if (
    lockOutcome.action === "already_live" ||
    lockOutcome.action === "already_in_progress"
  ) {
    return {
      action: lockOutcome.action,
      ...toStatusResponse(lockOutcome.botRecord, true),
    };
  }

  const action = lockOutcome.action;
  const botRecord = lockOutcome.botRecord;

  try {
    const deployment = await executeRailwayDeployAction(
      {
        action,
        context: {
          organizationId: context.organizationId,
        },
        botRecord,
        railwayConfig,
      },
      DEFAULT_DEPLOY_RAILWAY_OPS,
    );

    const nextStatus = await markBotDeploying(db, context.organizationId, {
      deploymentId: deployment.deploymentId,
      status: deployment.deploymentId ? "deploying" : "provisioning",
    });

    return {
      action,
      ...toStatusResponse(nextStatus, true),
    };
  } catch (error) {
    const failed = await markBotFailure(
      db,
      context.organizationId,
      toErrorMessage(error),
    );

    return {
      action,
      ...toStatusResponse(failed, true),
    };
  }
}
