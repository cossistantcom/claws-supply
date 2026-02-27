"use client";

import { Loader2Icon, LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

function resolveErrorMessage(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Unable to sign out right now.";
}

export function SignOutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignOut() {
    setIsLoading(true);

    const { error } = await authClient.signOut();

    if (error) {
      toast.error(resolveErrorMessage(error));
      setIsLoading(false);
      return;
    }

    toast.success("Signed out.");
    router.push("/");
    router.refresh();
    setIsLoading(false);
  }

  return (
    <Button
      variant="outline"
      onClick={handleSignOut}
      disabled={isLoading}
      className="text-xs tracking-wider"
    >
      {isLoading ? (
        <>
          <Loader2Icon className="animate-spin" />
          SIGNING OUT...
        </>
      ) : (
        <>LOG OUT</>
      )}
    </Button>
  );
}
