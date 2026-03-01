import "server-only";

import { unstable_cache } from "next/cache";
import { desc, eq, gte, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { isUserVerified } from "@/lib/profile/verification";
import type {
  CommunitySidebarSnapshot,
  MembersDirectoryQueryInput,
  MembersDirectoryResult,
  PublicMember,
  SitemapMemberEntry,
} from "./types";

const READ_CACHE_REVALIDATE_SECONDS = 120;
const DEFAULT_DIRECTORY_PAGE = 1;
const DEFAULT_DIRECTORY_LIMIT = 30;
const MAX_DIRECTORY_LIMIT = 60;

type MemberRow = {
  id: string;
  username: string;
  name: string;
  bio: string | null;
  image: string | null;
  xAccountId: string | null;
  stripeVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function toNonNegativeInteger(value: number): number {
  const rounded = Math.round(value);
  return rounded >= 0 ? rounded : 0;
}

function normalizeDirectoryInput(
  input: MembersDirectoryQueryInput,
): MembersDirectoryQueryInput {
  const page = Number.isFinite(input.page)
    ? Math.max(DEFAULT_DIRECTORY_PAGE, Math.floor(input.page))
    : DEFAULT_DIRECTORY_PAGE;
  const rawLimit = Number.isFinite(input.limit)
    ? Math.floor(input.limit)
    : DEFAULT_DIRECTORY_LIMIT;
  const limit = Math.min(Math.max(rawLimit, 1), MAX_DIRECTORY_LIMIT);
  const q = input.q?.trim() || undefined;

  return {
    q,
    page,
    limit,
  };
}

function mapPublicMember(row: MemberRow): PublicMember {
  const hasVerifiedTwitterProfile = Boolean(row.xAccountId);
  const hasVerifiedStripeIdentity = row.stripeVerified;

  return {
    id: row.id,
    username: row.username,
    name: row.name,
    bio: row.bio,
    image: row.image,
    createdAt: row.createdAt.toISOString(),
    hasVerifiedTwitterProfile,
    hasVerifiedStripeIdentity,
    isVerified: isUserVerified({
      hasVerifiedTwitterProfile,
      hasVerifiedStripeIdentity,
    }),
  };
}

function buildDirectoryWhere(
  input: MembersDirectoryQueryInput,
): SQL<unknown> | undefined {
  if (!input.q) {
    return undefined;
  }

  const pattern = `%${input.q}%`;

  return or(ilike(user.username, pattern), ilike(user.name, pattern)) ?? undefined;
}

async function listMemberRows(options: {
  whereClause?: SQL<unknown>;
  limit: number;
  offset: number;
}): Promise<MemberRow[]> {
  const baseQuery = db
    .select({
      id: user.id,
      username: user.username,
      name: user.name,
      bio: user.bio,
      image: user.image,
      xAccountId: user.xAccountId,
      stripeVerified: user.stripeVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
    .from(user);

  const query = options.whereClause
    ? baseQuery.where(options.whereClause)
    : baseQuery;

  return query
    .orderBy(desc(user.createdAt), desc(user.updatedAt))
    .limit(options.limit)
    .offset(options.offset);
}

export async function listMembersForDirectory(
  input: MembersDirectoryQueryInput,
): Promise<MembersDirectoryResult> {
  const normalizedInput = normalizeDirectoryInput(input);
  const whereClause = buildDirectoryWhere(normalizedInput);
  const offset = (normalizedInput.page - 1) * normalizedInput.limit;

  const [rows, total] = await Promise.all([
    listMemberRows({
      whereClause,
      limit: normalizedInput.limit,
      offset,
    }),
    whereClause ? db.$count(user, whereClause) : db.$count(user),
  ]);

  const totalPages =
    total === 0 ? 0 : Math.ceil(total / Math.max(normalizedInput.limit, 1));

  return {
    items: rows.map(mapPublicMember),
    page: normalizedInput.page,
    limit: normalizedInput.limit,
    total,
    totalPages,
    hasNextPage: totalPages > 0 && normalizedInput.page < totalPages,
    hasPreviousPage: normalizedInput.page > 1,
    query: normalizedInput.q ?? null,
  };
}

export async function getPublicMemberByUsername(
  username: string,
): Promise<PublicMember | null> {
  const normalizedUsername = username.trim().toLowerCase();
  if (!normalizedUsername) {
    return null;
  }

  const [row] = await db
    .select({
      id: user.id,
      username: user.username,
      name: user.name,
      bio: user.bio,
      image: user.image,
      xAccountId: user.xAccountId,
      stripeVerified: user.stripeVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
    .from(user)
    .where(eq(user.username, normalizedUsername))
    .limit(1);

  if (!row) {
    return null;
  }

  return mapPublicMember(row);
}

export async function getCommunitySidebarSnapshot(options?: {
  limit?: number;
}): Promise<CommunitySidebarSnapshot> {
  const limit = toNonNegativeInteger(options?.limit ?? 10);
  const normalizedLimit = limit > 0 ? Math.min(limit, 25) : 10;
  const joinedAfter = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [latestRows, joinedLast24Hours] = await Promise.all([
    db
      .select({
        id: user.id,
        username: user.username,
        name: user.name,
        image: user.image,
        createdAt: user.createdAt,
      })
      .from(user)
      .orderBy(desc(user.createdAt), desc(user.updatedAt))
      .limit(normalizedLimit),
    db.$count(user, gte(user.createdAt, joinedAfter)),
  ]);

  return {
    joinedLast24Hours,
    latestMembers: latestRows.map((row) => ({
      id: row.id,
      username: row.username,
      name: row.name,
      image: row.image,
      createdAt: row.createdAt.toISOString(),
    })),
  };
}

export async function listMembersForSitemap(): Promise<SitemapMemberEntry[]> {
  return db
    .select({
      username: user.username,
      updatedAt: user.updatedAt,
    })
    .from(user)
    .orderBy(desc(user.updatedAt));
}

const getPublicMemberByUsernameCachedImpl = unstable_cache(
  async (username: string) => getPublicMemberByUsername(username),
  ["members-public-by-username"],
  {
    revalidate: READ_CACHE_REVALIDATE_SECONDS,
  },
);

const getCommunitySidebarSnapshotCachedImpl = unstable_cache(
  async (limit: number) => getCommunitySidebarSnapshot({ limit }),
  ["members-sidebar-snapshot"],
  {
    revalidate: READ_CACHE_REVALIDATE_SECONDS,
  },
);

const listMembersForSitemapCachedImpl = unstable_cache(
  async () => listMembersForSitemap(),
  ["members-sitemap"],
  {
    revalidate: READ_CACHE_REVALIDATE_SECONDS,
  },
);

export async function getPublicMemberByUsernameCached(
  username: string,
): Promise<PublicMember | null> {
  return getPublicMemberByUsernameCachedImpl(username.trim().toLowerCase());
}

export async function getCommunitySidebarSnapshotCached(options?: {
  limit?: number;
}): Promise<CommunitySidebarSnapshot> {
  return getCommunitySidebarSnapshotCachedImpl(
    toNonNegativeInteger(options?.limit ?? 10),
  );
}

export async function listMembersForSitemapCached(): Promise<SitemapMemberEntry[]> {
  return listMembersForSitemapCachedImpl();
}
