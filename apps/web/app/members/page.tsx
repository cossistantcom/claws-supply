import Link from "next/link";
import { OpenClawPageShell } from "@/components/openclaw-page-shell";
import { MemberAvatar } from "@/components/members/member-avatar";
import { listMembersForDirectory } from "@/lib/members/read-service";
import { memberPath, membersPath } from "@/lib/routes";
import { buildSeoMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

const MEMBERS_DIRECTORY_LIMIT = 30;

type MembersSearchParams = {
  q?: string | string[];
  page?: string | string[];
};

type MembersPageProps = {
  searchParams: Promise<MembersSearchParams>;
};

type ParsedMembersSearch = {
  q?: string;
  page: number;
};

function getFirstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function parsePageValue(rawPage: string | undefined): number {
  if (!rawPage) {
    return 1;
  }

  const parsed = Number.parseInt(rawPage, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

function parseSearchParams(searchParams: MembersSearchParams): ParsedMembersSearch {
  const q = getFirstValue(searchParams.q)?.trim() || undefined;
  const page = parsePageValue(getFirstValue(searchParams.page));

  return {
    q,
    page,
  };
}

function buildMembersHref(input: ParsedMembersSearch) {
  const search = new URLSearchParams();

  if (input.q) {
    search.set("q", input.q);
  }

  if (input.page > 1) {
    search.set("page", String(input.page));
  }

  const query = search.toString();

  return query.length > 0 ? `${membersPath()}?${query}` : membersPath();
}

function toPreviewText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

export async function generateMetadata({
  searchParams,
}: MembersPageProps): Promise<Metadata> {
  const query = parseSearchParams(await searchParams);

  return buildSeoMetadata({
    title: "Browse Members — Claws.supply",
    description:
      "Explore the growing Claws.supply community and discover creators publishing OpenClaw templates.",
    path: membersPath(),
    noindex: Boolean(query.q) || query.page > 1,
  });
}

export default async function MembersPage({ searchParams }: MembersPageProps) {
  const query = parseSearchParams(await searchParams);
  const result = await listMembersForDirectory({
    q: query.q,
    page: query.page,
    limit: MEMBERS_DIRECTORY_LIMIT,
  });
  const previousPageHref = buildMembersHref({
    q: query.q,
    page: Math.max(result.page - 1, 1),
  });
  const nextPageHref = buildMembersHref({
    q: query.q,
    page: result.page + 1,
  });

  return (
    <main className="min-h-screen px-6 pb-16 pt-24 md:px-0">
      <OpenClawPageShell contentClassName="w-full max-w-6xl space-y-8">
        <header className="space-y-4 border-b border-border pb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Community
              </p>
              <h1 className="text-3xl sm:text-4xl">Browse Members</h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Join the Claws.supply community with{" "}
                {result.total.toLocaleString()} members.
              </p>
            </div>
            <Link
              href="/auth/sign-up"
              className="border border-border px-5 py-2 text-sm transition-colors hover:border-cossistant-orange/40"
            >
              Join the community
            </Link>
          </div>

          <form action={membersPath()} method="get" className="flex gap-2">
            <input
              type="search"
              name="q"
              defaultValue={query.q ?? ""}
              placeholder="Search members"
              className="h-10 flex-1 border border-border bg-background px-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button
              type="submit"
              className="h-10 border border-border px-4 text-xs uppercase tracking-wide transition-colors hover:border-cossistant-orange/40"
            >
              Search
            </button>
            {query.q ? (
              <Link
                href={membersPath()}
                className="inline-flex h-10 items-center border border-border px-4 text-xs uppercase tracking-wide transition-colors hover:border-cossistant-orange/40"
              >
                Clear
              </Link>
            ) : null}
          </form>
        </header>

        {result.items.length > 0 ? (
          <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {result.items.map((member) => (
              <Link
                key={member.id}
                href={memberPath(member.username)}
                className="flex min-h-28 flex-col justify-between border border-border p-3 transition-colors hover:border-cossistant-orange/40"
              >
                <div className="flex items-start gap-3">
                  <MemberAvatar
                    name={member.name}
                    username={member.username}
                    image={member.image}
                    className="size-10 shrink-0"
                  />
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm">{member.name}</p>
                    <p className="text-xs text-muted-foreground">@{member.username}</p>
                    {member.bio ? (
                      <p className="text-xs text-muted-foreground">
                        {toPreviewText(member.bio, 120)}
                      </p>
                    ) : null}
                  </div>
                </div>
                <p
                  className={[
                    "mt-3 text-[11px] uppercase tracking-wide",
                    member.isVerified ? "text-cossistant-green" : "text-muted-foreground",
                  ].join(" ")}
                >
                  {member.isVerified ? "VERIFIED" : "NOT VERIFIED"}
                </p>
              </Link>
            ))}
          </section>
        ) : (
          <section className="border border-border p-4 text-sm text-muted-foreground">
            No members matched your search.
          </section>
        )}

        {result.totalPages > 1 ? (
          <footer className="flex items-center justify-between border-t border-border pt-4 text-xs">
            <p className="text-muted-foreground">
              Page {result.page} of {result.totalPages}
            </p>
            <div className="flex items-center gap-2">
              {result.hasPreviousPage ? (
                <Link
                  href={previousPageHref}
                  className="border border-border px-3 py-1.5 transition-colors hover:border-cossistant-orange/40"
                >
                  Previous
                </Link>
              ) : (
                <span className="border border-border px-3 py-1.5 text-muted-foreground/50">
                  Previous
                </span>
              )}
              {result.hasNextPage ? (
                <Link
                  href={nextPageHref}
                  className="border border-border px-3 py-1.5 transition-colors hover:border-cossistant-orange/40"
                >
                  Next
                </Link>
              ) : (
                <span className="border border-border px-3 py-1.5 text-muted-foreground/50">
                  Next
                </span>
              )}
            </div>
          </footer>
        ) : null}
      </OpenClawPageShell>
    </main>
  );
}
