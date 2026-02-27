import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { member, subscription } from "@/lib/db/schema";

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

export type SubscriptionRecord = typeof subscription.$inferSelect;

export async function resolveActiveOrganizationId(params: {
  userId: string;
  sessionActiveOrganizationId?: string | null;
}): Promise<string | null> {
  if (params.sessionActiveOrganizationId) {
    return params.sessionActiveOrganizationId;
  }

  const membership = await db
    .select({ organizationId: member.organizationId })
    .from(member)
    .where(eq(member.userId, params.userId))
    .orderBy(desc(member.createdAt))
    .limit(1);

  return membership[0]?.organizationId ?? null;
}

export async function getOrganizationSubscriptions(
  referenceId: string,
): Promise<SubscriptionRecord[]> {
  return db
    .select()
    .from(subscription)
    .where(eq(subscription.referenceId, referenceId))
    .orderBy(desc(subscription.updatedAt), desc(subscription.createdAt));
}

export function hasActiveOrTrialingSubscription(
  subscriptions: SubscriptionRecord[],
): boolean {
  return subscriptions.some((record) =>
    ACTIVE_SUBSCRIPTION_STATUSES.has(record.status),
  );
}

export function selectCurrentSubscription(
  subscriptions: SubscriptionRecord[],
): SubscriptionRecord | null {
  return (
    subscriptions.find((record) =>
      ACTIVE_SUBSCRIPTION_STATUSES.has(record.status),
    ) ??
    subscriptions[0] ??
    null
  );
}
