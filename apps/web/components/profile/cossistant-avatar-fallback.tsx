"use client";

import {
  AvatarFallback,
  type AvatarFallbackProps,
} from "facehash";

export const DEFAULT_FACEHASH_COLOR_CLASSES = [
  "bg-cossistant-pink",
  "bg-cossistant-yellow",
  "bg-cossistant-blue",
  "bg-cossistant-orange",
  "bg-cossistant-green",
] as const;

export function CossistantAvatarFallback({
  facehashProps,
  ...props
}: AvatarFallbackProps) {
  return (
    <AvatarFallback
      {...props}
      facehashProps={{
        ...facehashProps,
        colorClasses:
          facehashProps?.colorClasses ?? [...DEFAULT_FACEHASH_COLOR_CLASSES],
      }}
    />
  );
}
