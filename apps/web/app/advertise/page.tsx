import type { Metadata } from "next";
import { OpenClawPageShell } from "@/components/openclaw-page-shell";
import { AdvertisePageClient } from "@/components/ads/advertise-page-client";
import { getSessionFromNextHeaders } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Advertise on Claws.supply",
  description:
    "Reach high-intent OpenClaw template buyers with sponsored placements across Claws.supply.",
};

export const dynamic = "force-dynamic";

export default async function AdvertisePage() {
  const session = await getSessionFromNextHeaders();

  return (
    <main className="min-h-screen px-6 pb-16 pt-24 md:px-0">
      <OpenClawPageShell contentClassName="w-full max-w-4xl">
        <AdvertisePageClient userId={session?.user.id ?? null} />
      </OpenClawPageShell>
    </main>
  );
}
