"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { HourglassLogo } from "@/components/hourglass-logo";

const STEPS = [
  {
    num: "01",
    title: "CHOOSE YOUR PLAN",
    desc: "Pick the tier that fits your stage. Lock in your rate permanently. Early founders get the best pricing.",
  },
  {
    num: "02",
    title: "STRATEGY CALL",
    desc: "We'll schedule a 30-min call to define your ideal buyer profile, targeting signals, and outreach strategy together.",
  },
  {
    num: "03",
    title: "PIPELINE ACTIVATES",
    desc: "Your dedicated growth engine goes live within 48 hours. Wake up to qualified opportunities every single morning.",
  },
];

export default function WelcomePage() {
  const router = useRouter();

  return (
    <div className="max-w-lg w-full">
      <div className="flex justify-center mb-8">
        <HourglassLogo pixelSize={6} animated />
      </div>

      <div className="text-center mb-10">
        <p className="font-pixel text-[10px] text-muted-foreground tracking-wider mb-3">
          YOU&apos;RE IN
        </p>
        <h1 className="font-pixel text-2xl sm:text-3xl mb-4">
          WELCOME TO HOURGLASS.
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
          Your account is set up. Here&apos;s what happens next to get your
          pipeline running.
        </p>
      </div>

      <div className="space-y-6 mb-10">
        {STEPS.map((step) => (
          <div key={step.num} className="flex gap-5 items-start">
            <span className="font-pixel text-3xl text-muted-foreground/20 leading-none shrink-0">
              {step.num}
            </span>
            <div>
              <h3 className="font-pixel text-[11px] tracking-wider mb-1">
                {step.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <Button
          size="lg"
          className="font-pixel text-xs tracking-wider px-10 h-12"
          onClick={() => router.push("/choose-plan")}
        >
          CHOOSE YOUR PLAN
        </Button>
        <p className="text-[10px] text-muted-foreground mt-3 font-pixel tracking-wider">
          STEP 1 OF 3
        </p>
      </div>
    </div>
  );
}
