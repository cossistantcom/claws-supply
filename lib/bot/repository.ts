import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { botInstance } from "@/lib/db/schema";
import type { BotStatus } from "./types";

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DbExecutor = typeof db | DbTransaction;

export type BotInstanceRecord = typeof botInstance.$inferSelect;

function now(): Date {
  return new Date();
}

async function updateBot(
  database: DbExecutor,
  organizationId: string,
  payload: Partial<typeof botInstance.$inferInsert>,
): Promise<BotInstanceRecord> {
  const updated = await database
    .update(botInstance)
    .set({
      ...payload,
      updatedAt: now(),
    })
    .where(eq(botInstance.organizationId, organizationId))
    .returning();

  const record = updated[0];
  if (!record) {
    throw new Error("Bot record was not found after update.");
  }

  return record;
}

export async function withBotInstanceLock<T>(
  organizationId: string,
  operation: (tx: DbTransaction) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${organizationId}))`,
    );
    return operation(tx);
  });
}

export async function getBotByOrganizationId(
  organizationId: string,
  database: DbExecutor = db,
): Promise<BotInstanceRecord | null> {
  const rows = await database
    .select()
    .from(botInstance)
    .where(eq(botInstance.organizationId, organizationId))
    .limit(1);

  return rows[0] ?? null;
}

export async function createBotRecord(
  database: DbExecutor,
  input: {
    organizationId: string;
    railwayProjectId: string;
    railwayEnvironmentId: string;
    imageRef: string;
    status: BotStatus;
  },
): Promise<BotInstanceRecord> {
  const inserted = await database
    .insert(botInstance)
    .values({
      id: crypto.randomUUID(),
      organizationId: input.organizationId,
      railwayProjectId: input.railwayProjectId,
      railwayEnvironmentId: input.railwayEnvironmentId,
      imageRef: input.imageRef,
      status: input.status,
      createdAt: now(),
      updatedAt: now(),
    })
    .onConflictDoNothing({
      target: botInstance.organizationId,
    })
    .returning();

  if (inserted[0]) {
    return inserted[0];
  }

  const existing = await getBotByOrganizationId(input.organizationId, database);
  if (!existing) {
    throw new Error("Unable to create or resolve bot record.");
  }

  return existing;
}

export async function markBotProvisioning(
  database: DbExecutor,
  organizationId: string,
  input: {
    imageRef: string;
  },
): Promise<BotInstanceRecord> {
  return updateBot(database, organizationId, {
    imageRef: input.imageRef,
    status: "provisioning",
    lastError: null,
    deletedAt: null,
  });
}

export async function markBotDeploying(
  database: DbExecutor,
  organizationId: string,
  input: {
    deploymentId: string | null;
    status: BotStatus;
  },
): Promise<BotInstanceRecord> {
  return updateBot(database, organizationId, {
    railwayDeploymentId: input.deploymentId,
    status: input.status,
    lastError: null,
  });
}

export async function setBotServiceDetails(
  database: DbExecutor,
  organizationId: string,
  input: {
    serviceId: string;
    serviceName: string;
  },
): Promise<BotInstanceRecord> {
  return updateBot(database, organizationId, {
    railwayServiceId: input.serviceId,
    railwayServiceName: input.serviceName,
    deletedAt: null,
  });
}

export async function updateBotDeploymentState(
  database: DbExecutor,
  organizationId: string,
  input: {
    deploymentId: string | null;
    status: BotStatus;
    lastRailwayStatus: string | null;
    successUrl: string | null;
  },
): Promise<BotInstanceRecord> {
  return updateBot(database, organizationId, {
    railwayDeploymentId: input.deploymentId,
    status: input.status,
    lastRailwayStatus: input.lastRailwayStatus,
    successUrl: input.successUrl,
    deployedAt: input.status === "live" ? now() : null,
    lastError: input.status === "failed" ? null : undefined,
  });
}

export async function markBotFailure(
  database: DbExecutor,
  organizationId: string,
  errorMessage: string,
): Promise<BotInstanceRecord> {
  return updateBot(database, organizationId, {
    status: "failed",
    lastError: errorMessage.slice(0, 1000),
  });
}

export async function markBotDeleting(
  database: DbExecutor,
  organizationId: string,
): Promise<BotInstanceRecord> {
  return updateBot(database, organizationId, {
    status: "deleting",
    lastError: null,
  });
}

export async function markBotDeleted(
  database: DbExecutor,
  organizationId: string,
): Promise<BotInstanceRecord> {
  return updateBot(database, organizationId, {
    status: "deleted",
    railwayServiceId: null,
    railwayServiceName: null,
    railwayDeploymentId: null,
    successUrl: null,
    lastRailwayStatus: null,
    deletedAt: now(),
  });
}

export async function clearDeletedMarkerIfActive(
  database: DbExecutor,
  organizationId: string,
): Promise<void> {
  await database
    .update(botInstance)
    .set({
      deletedAt: null,
      updatedAt: now(),
    })
    .where(
      and(
        eq(botInstance.organizationId, organizationId),
        eq(botInstance.status, "deleted"),
      ),
    );
}
