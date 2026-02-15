import { HourglassLogo } from "@/components/hourglass-logo";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="py-6 px-6 flex justify-center">
        <div className="flex items-center gap-2">
          <HourglassLogo pixelSize={3} />
          <span className="font-pixel text-sm tracking-wider">
            hourglass.bot
          </span>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-6 pb-16">
        {children}
      </main>
    </div>
  );
}
