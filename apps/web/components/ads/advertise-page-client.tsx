"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Loader2Icon } from "lucide-react";
import { FileUploadField } from "@/components/templates/file-upload-field";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useAdsAvailabilityQuery,
  useCancelAdCampaignMutation,
  useCreateAdCampaignMutation,
  useCurrentAdCampaignQuery,
} from "@/lib/ads/query";
import type { AdPlacementInput } from "@/lib/ads/schemas";
import { useBlobUpload } from "@/lib/templates/client/use-blob-upload";

type AdvertisePageClientProps = {
  userId: string | null;
};

type PlacementCard = {
  placement: AdPlacementInput;
  title: string;
  description: string;
  monthlyPriceCents: number;
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }

  return fallback;
}

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function placementLabel(value: AdPlacementInput) {
  if (value === "sidebar") {
    return "Sidebar";
  }

  if (value === "results") {
    return "Results";
  }

  return "Sidebar + Results";
}

export function AdvertisePageClient({ userId }: AdvertisePageClientProps) {
  const availabilityQuery = useAdsAvailabilityQuery();
  const campaignQuery = useCurrentAdCampaignQuery(Boolean(userId));
  const createCampaignMutation = useCreateAdCampaignMutation();
  const cancelCampaignMutation = useCancelAdCampaignMutation();
  const logoUpload = useBlobUpload(
    userId
      ? {
          kind: "ad-logo",
          userId,
        }
      : {
          kind: "ad-logo",
          userId: "anonymous",
        },
  );

  const [placement, setPlacement] = useState<AdPlacementInput>("sidebar");
  const [companyName, setCompanyName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const availability = availabilityQuery.data;
  const campaign = campaignQuery.data;

  const placementCards = useMemo<PlacementCard[]>(() => {
    const pricing = availability?.pricing ?? {
      sidebar: 49_900,
      results: 69_900,
      both: 99_900,
    };

    return [
      {
        placement: "sidebar",
        title: "Sidebar",
        description:
          "Persistent right-rail visibility across marketplace pages.",
        monthlyPriceCents: pricing.sidebar,
      },
      {
        placement: "results",
        title: "Results",
        description:
          "Sponsored cards injected in browsing flows with buyer intent.",
        monthlyPriceCents: pricing.results,
      },
      {
        placement: "both",
        title: "Both",
        description: "Maximum exposure across sidebar and results placements.",
        monthlyPriceCents: pricing.both,
      },
    ];
  }, [availability?.pricing]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!userId) {
      setActionError("Please sign in to start an advertising campaign.");
      setActionMessage(null);
      return;
    }

    if (!logoUpload.result) {
      setActionError("Please upload your SVG logo before continuing.");
      setActionMessage(null);
      return;
    }

    setActionError(null);
    setActionMessage(null);

    createCampaignMutation.mutate(
      {
        placement,
        companyName,
        websiteUrl,
        shortDescription,
        logoUpload: {
          pathname: logoUpload.result.pathname,
          url: logoUpload.result.url,
          contentType: logoUpload.result.contentType,
        },
      },
      {
        onSuccess: (result) => {
          window.location.assign(result.checkoutUrl);
        },
        onError: (error) => {
          setActionError(
            getErrorMessage(error, "Unable to start advertising checkout."),
          );
        },
      },
    );
  }

  function handleCancelCampaign() {
    setActionError(null);
    setActionMessage(null);

    cancelCampaignMutation.mutate(undefined, {
      onSuccess: () => {
        setActionMessage(
          "Cancellation scheduled. Your ad remains live until the current billing period ends.",
        );
      },
      onError: (error) => {
        setActionError(getErrorMessage(error, "Unable to cancel campaign."));
      },
    });
  }

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="border-0 p-0 flex flex-col gap-4">
        <h1 className="text-3xl sm:text-4xl">Advertise with us</h1>
        <h3 className="max-w-3xl text-sm leading-relaxed">
          Reach high-intent OpenClaw buyers who are actively evaluating agent
          templates, tools, and automation workflows. Your brand appears where
          purchase decisions happen, not in low-intent traffic feeds.
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="border border-border p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Audience
            </p>
            <p className="text-sm">Builders and technical buyers</p>
          </div>
          <div className="border border-border p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Intent
            </p>
            <p className="text-sm">Active template discovery sessions</p>
          </div>
          <div className="border border-border p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Spots Left
            </p>
            <p className="text-sm">
              {availabilityQuery.isPending
                ? "Loading..."
                : `${availability?.spotsLeft ?? 0}/${availability?.slotLimit ?? 30}`}
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
          <CardDescription>
            Monthly subscription. Cancel anytime; campaign visibility remains
            until the end of the paid billing cycle.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {placementCards.map((option) => (
            <button
              key={option.placement}
              type="button"
              onClick={() => setPlacement(option.placement)}
              className={[
                "border p-4 text-left transition-colors",
                placement === option.placement
                  ? "border-cossistant-orange bg-cossistant-orange/5"
                  : "border-border hover:border-cossistant-orange/40",
              ].join(" ")}
            >
              <p className="text-sm">{option.title}</p>
              <p className="mt-1 text-xl">
                {formatPrice(option.monthlyPriceCents)}/mo
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {option.description}
              </p>
            </button>
          ))}
        </CardContent>
      </Card>

      {userId ? (
        <Card>
          <CardHeader>
            <CardTitle>Start Campaign</CardTitle>
            <CardDescription>
              Submit your ad details, then complete Stripe checkout to activate.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <label
                  className="text-xs uppercase tracking-wide"
                  htmlFor="company-name"
                >
                  Company name
                </label>
                <Input
                  id="company-name"
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                  maxLength={80}
                  required
                />
              </div>

              <div className="space-y-1">
                <label
                  className="text-xs uppercase tracking-wide"
                  htmlFor="website-url"
                >
                  Website URL
                </label>
                <Input
                  id="website-url"
                  type="url"
                  value={websiteUrl}
                  onChange={(event) => setWebsiteUrl(event.target.value)}
                  placeholder="https://example.com"
                  maxLength={500}
                  required
                />
              </div>

              <div className="space-y-1">
                <label
                  className="text-xs uppercase tracking-wide"
                  htmlFor="short-description"
                >
                  Short description
                </label>
                <Textarea
                  id="short-description"
                  value={shortDescription}
                  onChange={(event) => setShortDescription(event.target.value)}
                  rows={4}
                  maxLength={180}
                  required
                />
              </div>

              <FileUploadField
                label="Logo (SVG)"
                description="Upload a clean SVG logo for your sponsored slot."
                accept=".svg,image/svg+xml"
                disabled={createCampaignMutation.isPending}
                status={logoUpload.status}
                progress={logoUpload.progress}
                error={logoUpload.error}
                successMessage={
                  logoUpload.result
                    ? `Uploaded ${logoUpload.result.pathname}`
                    : "Logo uploaded."
                }
                onUploadFile={async (file) => {
                  await logoUpload.uploadFile(file);
                }}
                onCancel={logoUpload.cancel}
                onReset={logoUpload.reset}
              />

              <div className="rounded-sm border border-border p-3 text-xs">
                Selected placement: <strong>{placementLabel(placement)}</strong>
              </div>

              {actionError ? (
                <p className="text-xs text-destructive">{actionError}</p>
              ) : null}
              {actionMessage ? (
                <p className="text-xs text-cossistant-orange">
                  {actionMessage}
                </p>
              ) : null}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={
                    createCampaignMutation.isPending ||
                    logoUpload.status === "uploading"
                  }
                >
                  {createCampaignMutation.isPending ? (
                    <>
                      <Loader2Icon className="animate-spin" />
                      Redirecting...
                    </>
                  ) : (
                    <>Start checkout</>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Sign in to advertise</CardTitle>
            <CardDescription>
              Campaign management and billing require an authenticated account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() =>
                window.location.assign("/auth/sign-in?next=/advertise")
              }
            >
              Sign in
            </Button>
          </CardContent>
        </Card>
      )}

      {userId ? (
        <Card>
          <CardHeader>
            <CardTitle>Your Campaign</CardTitle>
            <CardDescription>
              Manage your active subscription and billing-cycle cancellation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {campaignQuery.isPending ? (
              <p className="text-xs text-muted-foreground">
                Loading campaign...
              </p>
            ) : campaign ? (
              <>
                <div className="grid gap-2 text-xs sm:grid-cols-2">
                  <p>
                    <span className="text-muted-foreground">Status:</span>{" "}
                    {campaign.status}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Placement:</span>{" "}
                    {placementLabel(campaign.placement)}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Period start:</span>{" "}
                    {campaign.currentPeriodStart
                      ? new Date(
                          campaign.currentPeriodStart,
                        ).toLocaleDateString()
                      : "n/a"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Period end:</span>{" "}
                    {campaign.currentPeriodEnd
                      ? new Date(campaign.currentPeriodEnd).toLocaleDateString()
                      : "n/a"}
                  </p>
                </div>
                {(campaign.status === "active" ||
                  campaign.status === "cancel_scheduled") && (
                  <Button
                    variant="outline"
                    onClick={handleCancelCampaign}
                    disabled={cancelCampaignMutation.isPending}
                  >
                    {cancelCampaignMutation.isPending ? (
                      <>
                        <Loader2Icon className="animate-spin" />
                        Canceling...
                      </>
                    ) : (
                      <>Cancel at period end</>
                    )}
                  </Button>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                No campaign yet. Complete the form above to start one.
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
