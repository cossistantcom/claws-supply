import type { Metadata } from "next";
import Link from "next/link";
import { OpenClawPageShell } from "@/components/openclaw-page-shell";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Publish OpenClaw Templates via CLI — Claws.supply",
  description:
    "Step-by-step CLI publishing flow for OpenClaw templates with auth, build, and publish commands.",
  path: "/openclaw/templates/publish-via-cli",
});

export default function PublishViaCliPage() {
  return (
    <main className="min-h-screen px-6 pb-16 pt-24 md:px-0">
      <OpenClawPageShell contentClassName="w-full max-w-3xl space-y-6">
        <header className="space-y-2 border-b border-border pb-4">
          <h1 className="text-3xl">Publish Templates via CLI</h1>
          <p className="text-sm text-muted-foreground">
            Template creation is now CLI-first. Run these commands from your local project.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-lg">1. Authenticate</h2>
          <pre className="border border-border p-3 text-sm overflow-x-auto">
{`npx claws-supply auth`}
          </pre>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg">2. Build + sign template</h2>
          <pre className="border border-border p-3 text-sm overflow-x-auto">
{`npx claws-supply build`}
          </pre>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg">3. Publish draft</h2>
          <pre className="border border-border p-3 text-sm overflow-x-auto">
{`npx claws-supply publish`}
          </pre>
          <p className="text-sm text-muted-foreground">
            The CLI prints the direct edit URL after draft creation. Only you and admins can view it until it is published.
          </p>
        </section>

        <section className="text-sm">
          <Link className="underline" href="/openclaw/templates/latest">
            Back to template browsing
          </Link>
        </section>
      </OpenClawPageShell>
    </main>
  );
}
