"use client";

import { Avatar, AvatarImage } from "facehash";
import Link from "next/link";
import { CossistantAvatarFallback } from "@/components/profile/cossistant-avatar-fallback";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ProfileSellerIdentityProps = {
  name: string;
  username: string;
  image: string | null;
  isVerified: boolean;
  memberHref?: string;
  className?: string;
  avatarClassName?: string;
  nameClassName?: string;
  usernameClassName?: string;
  showName?: boolean;
  showStatusBadge?: boolean;
};

export function ProfileSellerIdentity({
  name,
  username,
  image,
  isVerified,
  memberHref,
  className,
  avatarClassName,
  nameClassName,
  usernameClassName,
  showName = true,
  showStatusBadge = true,
}: ProfileSellerIdentityProps) {
  const identityName = name.trim().length > 0 ? name : username;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-3">
        <Avatar
          className={cn(
            "size-12 overflow-hidden border border-border bg-muted",
            avatarClassName,
          )}
        >
          {image ? <AvatarImage src={image} alt={`${identityName} avatar`} /> : null}
          <CossistantAvatarFallback
            className="text-black"
            name={username || identityName || "user"}
          />
        </Avatar>
        <div className="min-w-0 space-y-1">
          {showName ? (
            <p className={cn("truncate text-sm", nameClassName)}>{identityName}</p>
          ) : null}
          <p className={cn("truncate text-xs text-muted-foreground", usernameClassName)}>
            @{username}
          </p>
          {showStatusBadge ? (
            <Badge variant={isVerified ? "secondary" : "outline"}>
              {isVerified ? "Verified seller 🦞" : "Not verified yet"}
            </Badge>
          ) : null}
        </div>
      </div>
      {memberHref ? (
        <Link
          href={memberHref}
          className="inline-block text-xs text-muted-foreground hover:text-foreground hover:underline"
        >
          View member page
        </Link>
      ) : null}
    </div>
  );
}
