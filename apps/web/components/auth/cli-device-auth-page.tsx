"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type DeviceAction = "idle" | "approving" | "denying" | "approved" | "denied" | "error";

type CliDeviceAuthPageProps = {
  userCode: string;
};

function resolveErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }

  return fallback;
}

async function postDecision(path: "approve" | "deny", userCode: string) {
  const response = await fetch(`/api/cli/v1/auth/device/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userCode }),
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        error?: {
          message?: string;
        };
      }
    | null;

  if (!response.ok) {
    throw new Error(payload?.error?.message ?? "Unable to complete request.");
  }
}

export function CliDeviceAuthPage({ userCode }: CliDeviceAuthPageProps) {
  const [action, setAction] = useState<DeviceAction>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleApprove() {
    setErrorMessage(null);
    setAction("approving");
    try {
      await postDecision("approve", userCode);
      setAction("approved");
    } catch (error) {
      setAction("error");
      setErrorMessage(resolveErrorMessage(error, "Unable to approve device code."));
    }
  }

  async function handleDeny() {
    setErrorMessage(null);
    setAction("denying");
    try {
      await postDecision("deny", userCode);
      setAction("denied");
    } catch (error) {
      setAction("error");
      setErrorMessage(resolveErrorMessage(error, "Unable to deny device code."));
    }
  }

  const isPending = action === "approving" || action === "denying";

  return (
    <main className="min-h-screen px-6 pb-16 pt-24 md:px-0">
      <div className="mx-auto w-full max-w-xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl">Authorize CLI Device</h1>
          <p className="text-sm text-muted-foreground">
            Review the code from your terminal and approve or deny this sign-in request.
          </p>
        </header>

        <section className="border border-border p-4 space-y-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Device Code</p>
          <p className="font-mono text-lg">{userCode}</p>
        </section>

        {action === "approved" ? (
          <p className="text-sm text-emerald-600">
            Approved. You can return to your terminal.
          </p>
        ) : null}

        {action === "denied" ? (
          <p className="text-sm text-amber-600">
            Request denied. You can close this window.
          </p>
        ) : null}

        {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

        <div className="flex gap-3">
          <Button type="button" onClick={handleApprove} disabled={isPending || action === "approved"}>
            {action === "approving" ? "Approving..." : "Approve"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleDeny}
            disabled={isPending || action === "denied"}
          >
            {action === "denying" ? "Denying..." : "Deny"}
          </Button>
        </div>
      </div>
    </main>
  );
}
