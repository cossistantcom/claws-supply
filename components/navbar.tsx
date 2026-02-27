"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { ProgressiveBlur } from "./progresive-blur";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  const session = authClient.useSession();
  const isLoggedIn = Boolean(session.data);
  const accountHref = isLoggedIn ? "/profile" : "/auth/sign-in";
  const accountLabel = isLoggedIn ? "PROFILE" : "LOGIN";
  const uploadHref = isLoggedIn ? "/profile" : "/auth/sign-up?next=/profile";

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
              className="font-pixel text-sm tracking-wider uppercase hover:opacity-80 transition-opacity"
              href="/"
            >
              claws.supply
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              className="font-pixel text-xs tracking-wider"
              onClick={() => router.push(accountHref)}
            >
              {accountLabel}
            </Button>
            <div className="pixel-ui">
              <Button
                className="font-pixel text-xs tracking-wider"
                onClick={() => router.push(uploadHref)}
              >
                UPLOAD YOUR TEMPLATE
              </Button>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
