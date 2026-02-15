"use client";

import { useEffect, useState } from "react";
import { HourglassLogo } from "@/components/hourglass-logo";
import { SpotsCounter } from "@/components/spots-counter";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 10);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-[border-color] duration-300 ${
        scrolled
          ? "border-b border-border bg-background backdrop-blur-sm"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HourglassLogo pixelSize={1.5} animated />
          <span className="font-pixel text-sm tracking-wider uppercase">HOURGLASS.BOT</span>
        </div>
        <div className="flex items-center gap-4">
          <SpotsCounter total={50} taken={0} className="hidden sm:flex" />
          <a href="#apply">
            <Button size="sm" className="font-pixel text-[10px] tracking-wider">
              APPLY FOR ACCESS
            </Button>
          </a>
        </div>
      </div>
    </nav>
  );
}
