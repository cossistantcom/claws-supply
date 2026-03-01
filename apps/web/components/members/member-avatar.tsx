"use client";

import { Avatar, AvatarImage } from "facehash";
import { CossistantAvatarFallback } from "@/components/profile/cossistant-avatar-fallback";
import { cn } from "@/lib/utils";

type MemberAvatarProps = {
  name: string;
  username: string;
  image: string | null;
  className?: string;
  fallbackClassName?: string;
};

export function MemberAvatar({
  name,
  username,
  image,
  className,
  fallbackClassName,
}: MemberAvatarProps) {
  const avatarName = name.trim().length > 0 ? name : username;

  return (
    <Avatar
      className={cn("overflow-hidden border border-border bg-muted", className)}
    >
      {image ? <AvatarImage src={image} alt={`${avatarName} avatar`} /> : null}
      <CossistantAvatarFallback
        className={cn("text-black", fallbackClassName)}
        name={username || avatarName || "user"}
      />
    </Avatar>
  );
}
