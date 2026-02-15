import { cn } from "@/lib/utils";

interface PhoneMockupProps {
  children: React.ReactNode;
  className?: string;
}

export function PhoneMockup({ children, className }: PhoneMockupProps) {
  return (
    <div className={cn("relative mx-auto w-[280px] sm:w-[320px]", className)}>
      {/* Outer glow */}
      <div className="absolute -inset-8 bg-white/[0.02] rounded-[80px] blur-3xl pointer-events-none" />

      {/* Phone body */}
      <div
        className="relative rounded-[40px] sm:rounded-[46px] border-[3px] border-white/[0.08] bg-black overflow-hidden"
        style={{ aspectRatio: "9 / 19.5" }}
      >
        {/* Side button accents */}
        <div className="absolute top-[80px] -left-[4px] w-[3px] h-[24px] bg-white/[0.06] rounded-l-sm" />
        <div className="absolute top-[120px] -left-[4px] w-[3px] h-[40px] bg-white/[0.06] rounded-l-sm" />
        <div className="absolute top-[168px] -left-[4px] w-[3px] h-[40px] bg-white/[0.06] rounded-l-sm" />
        <div className="absolute top-[120px] -right-[4px] w-[3px] h-[56px] bg-white/[0.06] rounded-r-sm" />

        {/* Dynamic island */}
        <div className="absolute top-[10px] sm:top-[12px] left-1/2 -translate-x-1/2 w-[72px] sm:w-[84px] h-[22px] sm:h-[26px] bg-black rounded-full z-20" />

        {/* Screen */}
        <div className="relative h-full w-full overflow-hidden">{children}</div>

        {/* Home indicator */}
        <div className="absolute bottom-[6px] sm:bottom-[8px] left-1/2 -translate-x-1/2 w-[80px] sm:w-[96px] h-[3px] sm:h-[4px] bg-white/15 rounded-full z-20" />
      </div>
    </div>
  );
}
