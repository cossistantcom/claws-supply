"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "facehash";
import {
  ExternalLinkIcon,
  Loader2Icon,
  RefreshCwIcon,
  SaveIcon,
  ShieldCheckIcon,
  UserRoundIcon,
} from "lucide-react";
import { DeleteAccountDialog } from "@/components/profile/delete-account-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  useConnectStripeMutation,
  useConnectXMutation,
  useDeleteAccountMutation,
  useProfileQuery,
  useRefreshStripeStatusMutation,
  useUpdateProfileMutation,
} from "@/lib/profile/query";

function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }

  return fallback;
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
  const formBio = draftProfile?.bio ?? (profile?.bio ?? "");

  const hasPendingConnectionAction =
    connectXMutation.isPending ||
    connectStripeMutation.isPending ||
    refreshStripeMutation.isPending;

  const isVerifiedSeller = useMemo(() => {
    if (!profile) {
      return false;
    }

    return profile.x.linked && profile.stripe.verified;
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
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="font-pixel tracking-wide">Profile Settings</CardTitle>
              <CardDescription>
                Manage your public profile and linked seller accounts.
              </CardDescription>
            </div>
            <Badge variant={isVerifiedSeller ? "secondary" : "outline"}>
              {isVerifiedSeller ? "Verified seller" : "Not verified"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar className="size-20 overflow-hidden border border-border bg-muted">
              {profile.image ? (
                <AvatarImage src={profile.image} alt={`${profile.name} avatar`} />
              ) : null}
              <AvatarFallback name={profile.username || profile.name || "user"} />
            </Avatar>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Public username
              </p>
              <p className="font-pixel text-sm">@{profile.username}</p>
              <p className="text-xs text-muted-foreground">
                Username is fixed and can&apos;t be edited here.
              </p>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label htmlFor="profile-name" className="text-xs uppercase tracking-wide">
                Name
              </label>
              <Input
                id="profile-name"
                value={formName}
                onChange={(event) =>
                  setDraftProfile((current) => ({
                    name: event.target.value,
                    bio: current?.bio ?? (profile.bio ?? ""),
                  }))
                }
                maxLength={80}
                required
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="profile-bio" className="text-xs uppercase tracking-wide">
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

            <Button
              type="submit"
              disabled={!hasProfileChanges || updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2Icon className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <SaveIcon />
                  Save profile
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-pixel tracking-wide">Connected Accounts</CardTitle>
          <CardDescription>
            Link X and Stripe to become a verified seller and earn from templates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">X Account</p>
                <p className="text-sm">
                  {profile.x.linked
                    ? `Linked as @${profile.x.username ?? "unknown"}`
                    : "Not linked"}
                </p>
              </div>
              <Badge variant={profile.x.linked ? "secondary" : "outline"}>
                {profile.x.linked ? "Linked" : "Not linked"}
              </Badge>
            </div>
            <Button
              variant={profile.x.linked ? "outline" : "default"}
              onClick={handleConnectX}
              disabled={profile.x.linked || hasPendingConnectionAction}
            >
              {connectXMutation.isPending ? (
                <>
                  <Loader2Icon className="animate-spin" />
                  Connecting...
                </>
              ) : profile.x.linked ? (
                "X linked"
              ) : (
                <>
                  <ExternalLinkIcon />
                  Connect X account
                </>
              )}
            </Button>
          </div>

          <div className="space-y-2 border-t pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Stripe Seller Account
                </p>
                <p className="text-sm">
                  {profile.stripe.connected
                    ? profile.stripe.verified
                      ? "Connected and verified"
                      : "Connected, pending verification"
                    : "Not connected"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={profile.stripe.connected ? "secondary" : "outline"}>
                  {profile.stripe.connected ? "Connected" : "Not connected"}
                </Badge>
                <Badge variant={profile.stripe.verified ? "secondary" : "outline"}>
                  {profile.stripe.verified ? "Verified" : "Pending"}
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={handleConnectStripe} disabled={hasPendingConnectionAction}>
                {connectStripeMutation.isPending ? (
                  <>
                    <Loader2Icon className="animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  <>
                    <ExternalLinkIcon />
                    {profile.stripe.connected
                      ? "Continue Stripe onboarding"
                      : "Connect Stripe account"}
                  </>
                )}
              </Button>

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
                  <>
                    <RefreshCwIcon />
                    Refresh status
                  </>
                )}
              </Button>
            </div>

            {profile.stripe.connected ? (
              <p className="text-xs text-muted-foreground">
                Details submitted: {profile.stripe.detailsSubmitted ? "yes" : "no"} ·
                Charges enabled: {profile.stripe.chargesEnabled ? "yes" : "no"} ·
                Payouts enabled: {profile.stripe.payoutsEnabled ? "yes" : "no"}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-pixel tracking-wide text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Account deletion is permanent. This cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <UserRoundIcon className="size-4" />
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

      {actionError ? <p className="text-xs text-destructive">{actionError}</p> : null}
    </div>
  );
}
