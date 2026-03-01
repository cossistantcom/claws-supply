"use client";

import { Avatar, AvatarImage } from "facehash";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CossistantAvatarFallback } from "@/components/profile/cossistant-avatar-fallback";
import { Button } from "@/components/ui/button";
import { ProgressiveBlur } from "./progresive-blur";
import { cn } from "@/lib/utils";
import { LobsterClawIcon } from "./lobster-claw";

type NavbarUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
} | null;

type NavbarProps = {
  user: NavbarUser;
};

export function Navbar({ user }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  const isLoggedIn = Boolean(user);
  const accountHref = isLoggedIn ? "/profile" : "/auth/sign-in";
  const accountLabel = isLoggedIn ? "PROFILE" : "LOGIN";
  const avatarName = user?.name || user?.email || "user";

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 10);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <ProgressiveBlur
        className={cn(
          "pointer-events-none fixed left-0 right-0 top-0 z-[9000] h-[120px] w-full transition-all duration-100",
          scrolled ? "opacity-100" : "opacity-0",
        )}
        blurIntensity={4}
        blurLayers={4}
        direction="top"
      />
      <div
        className={cn(
          "pointer-events-none fixed left-0 right-0 top-0 z-[9200] h-[200px] bg-gradient-to-t from-transparent to-background/70 transition-opacity",
          scrolled ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        className={cn(
          "pointer-events-none fixed left-0 right-0 top-0 z-[9300] h-[50px] bg-gradient-to-t from-transparent to-background transition-opacity",
          scrolled ? "opacity-100" : "opacity-0",
        )}
      />
      <nav className="fixed top-0 left-0 right-0 z-[9998] transition-[border-color] duration-300">
        <div className="mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              className="font-pixel text-sm flex items-center gap-2 tracking-wider uppercase hover:opacity-80 transition-opacity"
              href="/"
            >
              <LobsterClawIcon className="size-8" />
              claws.supply
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link
              className="text-xs tracking-wider hover:opacity-80 transition-opacity"
              href="/advertise"
            >
              ADVERTISE
            </Link>
            {isLoggedIn ? (
              <Button
                variant="ghost"
                className="h-auto rounded-none p-0 hover:bg-transparent"
                onClick={() => router.push(accountHref)}
                aria-label={accountLabel}
              >
                <Avatar className="size-8 overflow-hidden border border-border bg-muted">
                  {user?.image ? (
                    <AvatarImage
                      src={user.image}
                      alt={`${avatarName} avatar`}
                    />
                  ) : null}
                  <CossistantAvatarFallback
                    className="text-black"
                    name={avatarName}
                  />
                </Avatar>
              </Button>
            ) : (
              <Button
                variant="ghost"
                className="text-xs tracking-wider"
                onClick={() => router.push(accountHref)}
              >
                {accountLabel}
              </Button>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
