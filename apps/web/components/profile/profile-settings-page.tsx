"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Avatar, AvatarImage } from "facehash";
import {
  ExternalLinkIcon,
  Loader2Icon,
  RefreshCwIcon,
  SaveIcon,
  ShieldCheckIcon,
  UserRoundIcon,
} from "lucide-react";
import { DeleteAccountDialog } from "@/components/profile/delete-account-dialog";
import { CossistantAvatarFallback } from "@/components/profile/cossistant-avatar-fallback";
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
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import {
  useConnectStripeMutation,
  useConnectXMutation,
  useDeleteAccountMutation,
  useProfileQuery,
  useRefreshStripeStatusMutation,
  useUpdateProfileMutation,
} from "@/lib/profile/query";
import { isUserVerified } from "@/lib/profile/verification";

function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }

  return fallback;
}

function ProviderLogoBadge({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="flex size-6 shrink-0 items-center justify-center rounded-none text-primary fill-primary">
      <Image src={src} alt={alt} width={24} height={24} />
    </div>
  );
}

export function ProfileSettingsPage() {
  const profileQuery = useProfileQuery();
  const updateProfileMutation = useUpdateProfileMutation();
  const connectXMutation = useConnectXMutation();
  const connectStripeMutation = useConnectStripeMutation();
  const refreshStripeMutation = useRefreshStripeStatusMutation();
  const deleteAccountMutation = useDeleteAccountMutation();

  const [draftProfile, setDraftProfile] = useState<{
    name: string;
    bio: string;
  } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const profile = profileQuery.data;
  const formName = draftProfile?.name ?? profile?.name ?? "";
  const formBio = draftProfile?.bio ?? profile?.bio ?? "";

  const hasPendingConnectionAction =
    connectXMutation.isPending ||
    connectStripeMutation.isPending ||
    refreshStripeMutation.isPending;

  const isVerifiedSeller = useMemo(() => {
    if (!profile) {
      return false;
    }

    return isUserVerified({
      hasVerifiedTwitterProfile: profile.x.linked,
      hasVerifiedStripeIdentity: profile.stripe.verified,
    });
  }, [profile]);

  const hasProfileChanges = useMemo(() => {
    if (!profile) {
      return false;
    }

    return (
      formName.trim() !== profile.name ||
      (formBio.trim() || "") !== (profile.bio ?? "")
    );
  }, [formBio, formName, profile]);

  const onboardingSteps = [
    {
      id: "connect-x",
      label: "Connect your X account.",
      completed: profile?.x.linked ?? false,
    },
    {
      id: "connect-stripe",
      label: "Complete Stripe verification.",
      completed: profile?.stripe.verified ?? false,
    },
  ];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionError(null);
    setActionMessage(null);

    updateProfileMutation.mutate(
      {
        name: formName,
        bio: formBio.trim().length > 0 ? formBio : null,
      },
      {
        onSuccess: () => {
          setDraftProfile(null);
          setActionMessage("Profile updated.");
        },
        onError: (error) => {
          setActionError(getErrorMessage(error, "Unable to update profile."));
        },
      },
    );
  }

  function handleConnectX() {
    setActionError(null);
    setActionMessage(null);

    connectXMutation.mutate(undefined, {
      onSuccess: (result) => {
        if (!result.url) {
          if (result.alreadyLinked) {
            setActionMessage("Your X account is already linked.");
            return;
          }

          setActionError("Unable to start X linking.");
          return;
        }

        window.location.assign(result.url);
      },
      onError: (error) => {
        setActionError(getErrorMessage(error, "Unable to start X linking."));
      },
    });
  }

  function handleConnectStripe() {
    setActionError(null);
    setActionMessage(null);

    connectStripeMutation.mutate(undefined, {
      onSuccess: (result) => {
        window.location.assign(result.url);
      },
      onError: (error) => {
        setActionError(
          getErrorMessage(error, "Unable to start Stripe onboarding."),
        );
      },
    });
  }

  function handleRefreshStripeStatus() {
    setActionError(null);
    setActionMessage(null);

    refreshStripeMutation.mutate(undefined, {
      onSuccess: () => {
        setActionMessage("Stripe status refreshed.");
      },
      onError: (error) => {
        setActionError(
          getErrorMessage(error, "Unable to refresh Stripe account status."),
        );
      },
    });
  }

  function handleDeleteAccount() {
    setActionError(null);
    setActionMessage(null);

    deleteAccountMutation.mutate(undefined, {
      onSuccess: () => {
        window.location.assign("/auth/sign-in");
      },
      onError: (error) => {
        setActionError(
          getErrorMessage(
            error,
            "Unable to delete account. Sign in again and retry.",
          ),
        );
      },
    });
  }

  if (profileQuery.isPending) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Loading your settings...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (profileQuery.isError || !profile) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            {getErrorMessage(profileQuery.error, "Unable to load profile.")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => profileQuery.refetch()} variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <Card>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar className="size-12 overflow-hidden border border-border bg-muted">
              {profile.image ? (
                <AvatarImage
                  src={profile.image}
                  alt={`${profile.name} avatar`}
                />
              ) : null}
              <CossistantAvatarFallback
                className="text-black"
                name={profile.username || profile.name || "user"}
              />
            </Avatar>
            <div className="space-y-2">
              <p className="text-base">@{profile.username}</p>
              <Badge variant={isVerifiedSeller ? "secondary" : "outline"}>
                {isVerifiedSeller ? "Verified seller 🦞" : "Not verified yet"}
              </Badge>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label
                htmlFor="profile-name"
                className="text-xs uppercase tracking-wide"
              >
                Name
              </label>
              <Input
                id="profile-name"
                value={formName}
                onChange={(event) =>
                  setDraftProfile((current) => ({
                    name: event.target.value,
                    bio: current?.bio ?? profile.bio ?? "",
                  }))
                }
                maxLength={80}
                required
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="profile-bio"
                className="text-xs uppercase tracking-wide"
              >
                Bio
              </label>
              <Textarea
                id="profile-bio"
                value={formBio}
                onChange={(event) =>
                  setDraftProfile((current) => ({
                    name: current?.name ?? profile.name,
                    bio: event.target.value,
                  }))
                }
                maxLength={280}
                rows={5}
                placeholder="Tell people what you create."
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                className="self-end"
                disabled={!hasProfileChanges || updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2Icon className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>Save</>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="tracking-wide">Onboarding checklist</CardTitle>
          <CardDescription>
            Next actions to start selling templates from your profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {onboardingSteps.map((step) => (
            <label
              key={step.id}
              className="flex items-center gap-3 text-sm text-foreground/90"
            >
              <input
                type="checkbox"
                checked={step.completed}
                readOnly
                aria-label={step.label}
                className="size-4 rounded-none border border-border accent-primary"
              />
              <span className={step.completed ? "" : "text-muted-foreground"}>
                {step.label}
              </span>
            </label>
          ))}
          <p className="text-xs text-primary/50 mt-6">
            Verified profiles are shown first.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="tracking-wide">Connected Accounts</CardTitle>
          <CardDescription>
            Link X and Stripe to become a verified seller and earn from
            templates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <section
            className={`p-4 ${
              profile.x.linked
                ? "border border-border bg-background"
                : "border border-dashed border-cossistant-orange/20 bg-cossistant-orange/5"
            }`}
          >
            <div className="space-y-3">
              <div className="flex-1 space-y-1">
                <p className="text-sm">X Account</p>
                <p className="text-xs text-muted-foreground">
                  {profile.x.linked
                    ? `Linked as @${profile.x.username ?? "unknown"}.`
                    : "Connect X to complete seller identity setup."}
                </p>
              </div>

              <div className="mt-6 flex justify-end">
                {!profile.x.linked ? (
                  <Button
                    onClick={handleConnectX}
                    disabled={hasPendingConnectionAction}
                  >
                    {connectXMutation.isPending ? (
                      <>
                        <Loader2Icon className="animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>Connect X account</>
                    )}
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    X account connected.
                  </p>
                )}
              </div>
            </div>
          </section>

          <section
            className={`p-4 ${
              profile.stripe.connected
                ? "border border-border bg-background"
                : "border border-dashed border-cossistant-orange/20 bg-cossistant-orange/5"
            }`}
          >
            <div className="space-y-3">
              <div className="flex-1 space-y-1">
                <p className="text-sm">Stripe Seller Account</p>
                <p className="text-xs text-muted-foreground">
                  {!profile.stripe.connected
                    ? "Connect Stripe to receive payouts from template sales."
                    : profile.stripe.verified
                      ? "Verified and ready for payouts."
                      : "Onboarding started. Complete Stripe verification to sell paid templates."}
                </p>
              </div>

              <div className="mt-6 flex justify-end">
                {!profile.stripe.connected ? (
                  <Button
                    onClick={handleConnectStripe}
                    disabled={hasPendingConnectionAction}
                  >
                    {connectStripeMutation.isPending ? (
                      <>
                        <Loader2Icon className="animate-spin" />
                        Redirecting...
                      </>
                    ) : (
                      <>Connect Stripe account</>
                    )}
                  </Button>
                ) : profile.stripe.verified ? (
                  <p className="text-right text-xs text-muted-foreground">
                    Stripe account verified.
                  </p>
                ) : (
                  <div className="mt-1 flex w-full flex-row items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      onClick={handleRefreshStripeStatus}
                      disabled={hasPendingConnectionAction}
                    >
                      {refreshStripeMutation.isPending ? (
                        <>
                          <Loader2Icon className="animate-spin" />
                          Refreshing...
                        </>
                      ) : (
                        <>Refresh</>
                      )}
                    </Button>
                    <Button
                      onClick={handleConnectStripe}
                      disabled={hasPendingConnectionAction}
                    >
                      {connectStripeMutation.isPending ? (
                        <>
                          <Loader2Icon className="animate-spin" />
                          Redirecting...
                        </>
                      ) : (
                        <>Continue Stripe onboarding</>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </section>
        </CardContent>
      </Card>

      <Card className="mt-40">
        <CardHeader>
          <CardTitle className="tracking-wide text-destructive">
            Danger Zone
          </CardTitle>
          <CardDescription>
            Account deletion is permanent. This cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            Delete your account and remove all access immediately.
          </div>
          <DeleteAccountDialog
            disabled={deleteAccountMutation.isPending}
            isDeleting={deleteAccountMutation.isPending}
            onConfirm={handleDeleteAccount}
          />
        </CardContent>
      </Card>

      {actionMessage ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheckIcon className="size-4" />
          {actionMessage}
        </div>
      ) : null}

      {actionError ? (
        <p className="text-xs text-destructive">{actionError}</p>
      ) : null}
    </div>
  );
}
