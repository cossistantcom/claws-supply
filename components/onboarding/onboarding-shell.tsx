"use client";

import type { ReactNode } from "react";
import { HourglassLogo } from "@/components/hourglass-logo";
import { OnboardingShowcase } from "@/components/onboarding/onboarding-showcase";

interface OnboardingShellProps {
  currentStep: number;
  totalSteps?: number;
  children: ReactNode;
}

export function OnboardingShell({
  currentStep,
  totalSteps = 4,
  children,
}: OnboardingShellProps) {
  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-14 px-6 flex items-center gap-3">
          <HourglassLogo pixelSize={1.5} animated />
          <span className="font-pixel text-sm tracking-wider uppercase">
            claws.supply
          </span>
        </header>

        <div className="px-6 mb-8">
          <div className="flex gap-1.5 max-w-sm">
            {Array.from({ length: totalSteps }, (_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 transition-colors ${
                  index + 1 <= currentStep
                    ? "bg-foreground"
                    : "bg-foreground/10"
                }`}
              />
            ))}
          </div>
          <p className="font-pixel text-[10px] tracking-wider text-muted-foreground mt-2">
            STEP {currentStep} OF {totalSteps}
          </p>
        </div>

        <main className="flex-1 flex items-center justify-center px-6 pb-16">
          {children}
        </main>
      </div>

      <div className="hidden lg:block lg:w-1/2 xl:w-[55%] bg-black relative">
        <OnboardingShowcase currentStep={currentStep} />
      </div>
    </div>
  );
}
