import { HourglassLogo } from "@/components/hourglass-logo";
import { Navbar } from "@/components/navbar";
import { AsciiPhoneShowcase } from "@/components/ascii-phone-showcase";
import { AsciiHourglassBackground } from "@/components/ascii-hourglass-background";
import { SandFillBg } from "@/components/sand-fill-bg";
import { SpotsCounter } from "@/components/spots-counter";
import { SecureSpotForm } from "@/components/secure-spot-form";
import { Badge } from "@/components/ui/badge";

const TIERS = [
  {
    name: "FOUNDING 50",
    price: "$299",
    active: true,
    label: "NOW OPEN",
    spots: 50,
  },
  {
    name: "NEXT 50",
    price: "$449",
    active: false,
    spots: 50,
  },
  {
    name: "FINAL 50",
    price: "$799",
    active: false,
    spots: 50,
  },
];

export default function Page() {
  return (
    <div className="min-h-screen">
      {/* ── NAV ── */}
      <Navbar />

      {/* ── HERO ── */}
      <SandFillBg
        variant="hourglass"
        backgroundLayer={<AsciiHourglassBackground />}
        className="min-h-screen flex flex-col items-center justify-center px-6 pt-14"
      >
        <div className="flex flex-col items-center text-center gap-6 max-w-3xl">
          <Badge
            variant="outline"
            className="font-pixel text-[10px] tracking-wider"
          >
            POWERED BY OPENCLAW
          </Badge>

          <HourglassLogo pixelSize={8} className="my-4" />

          <h1 className="font-pixel text-3xl sm:text-4xl md:text-5xl leading-[1.1] tracking-tight">
            WAKE UP TO A FULL PIPELINE.
            <br />
            <span className="text-muted-foreground">EVERY. SINGLE. DAY.</span>
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground max-w-xl leading-relaxed">
            You decide the strategy. It works around the clock. We track
            what&apos;s working and improve it with you. Your pipeline grows.
            You close.
          </p>

          <SecureSpotForm className="mt-2 w-full" />

          <div className="flex flex-col items-center gap-2">
            <SpotsCounter total={50} taken={0} />
            <p className="text-[11px] text-primary/60 font-pixel tracking-wider">
              FOUNDING TIER / $299/MO / FOR REVENUE-STAGE FOUNDERS
            </p>
          </div>
        </div>
      </SandFillBg>

      {/* ── DAILY BRIEFING PHONE ── */}
      <section className="py-24 sm:py-32 bg-background overflow-x-clip">
        <div className="px-6 max-w-3xl mx-auto flex flex-col items-center">
          <p className="font-pixel text-[10px] text-muted-foreground tracking-wider mb-3">
            EVERY MORNING
          </p>
          <h2 className="font-pixel text-xl sm:text-2xl mb-12 text-center">
            YOU WAKE UP TO THIS.
          </h2>
        </div>
        <div className="relative left-1/2 w-screen -translate-x-1/2">
          <AsciiPhoneShowcase />
        </div>
      </section>

      {/* ── WHY IT WORKS ── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="font-pixel text-[10px] text-muted-foreground tracking-wider mb-3">
            THE LEVERAGE
          </p>
          <h2 className="font-pixel text-xl sm:text-2xl md:text-3xl mb-4">
            REPLACE YOUR $3K/MO AGENCY
            <br />
            WITH SOMETHING THAT ACTUALLY LEARNS.
          </h2>
          <p className="text-sm text-muted-foreground mb-12 max-w-lg">
            A freelancer costs $2k/mo minimum and needs managing. An agency
            charges $3-5k and delivers a spreadsheet once a month. This costs a
            fraction, runs 24/7, and gets sharper every single day.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                title: "BUYERS WHO ARE ALREADY LOOKING",
                desc: "Not cold leads. High-intent prospects showing real buying signals: hiring, fundraising, tech adoption, competitor churn. People ready to have a conversation.",
              },
              {
                title: "PIPELINE THAT BUILDS ITSELF",
                desc: "Every morning you wake up to new qualified opportunities. No prospecting. No research. No manual outreach. Just conversations waiting to happen.",
              },
              {
                title: "GETS SMARTER WITH EVERY DEAL",
                desc: "Tell it what converted. Tell it what didn't. It adapts instantly. The longer it runs, the better your pipeline gets. No retraining. No waiting.",
              },
              {
                title: "CHEAPER THAN YOUR WORST HIRE",
                desc: "One closed deal pays for a full year. The ROI isn't incremental. It's transformational. And it never calls in sick.",
              },
            ].map((item) => (
              <div key={item.title} className="border border-border p-5">
                <h3 className="font-pixel text-xs tracking-wider mb-2">
                  {item.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── THE PROBLEM ── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="font-pixel text-[10px] text-muted-foreground tracking-wider mb-3">
            THE PROBLEM
          </p>
          <h2 className="font-pixel text-xl sm:text-2xl md:text-3xl mb-4">
            EVERYONE WANTS AN AI GROWTH OPERATOR.
            <br />
            NOBODY CAN SET ONE UP.
          </h2>
          <p className="text-sm text-muted-foreground mb-12 max-w-lg">
            OpenClaw is the most powerful agent framework out there. But between
            servers, configs, and constant debugging, most founders never get
            past the install screen.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                title: "YOU LOSE WEEKS",
                desc: "Server setup, environment config, API integrations. Weeks of technical work before you see a single lead.",
              },
              {
                title: "IT BREAKS SILENTLY",
                desc: "The system goes down. You don't notice for days. Pipeline dries up. Revenue stalls. Nobody tells you.",
              },
              {
                title: "STRATEGY TAKES MONTHS",
                desc: "Getting the targeting right takes real expertise. Most founders waste months tweaking parameters that never click.",
              },
              {
                title: "YOU'RE BUILDING, NOT SELLING",
                desc: "Every hour spent on infrastructure is an hour not spent closing deals. The opportunity cost is enormous.",
              },
            ].map((item) => (
              <div key={item.title} className="border border-border p-5">
                <h3 className="font-pixel text-xs tracking-wider mb-2">
                  {item.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── THE SOLUTION ── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="font-pixel text-[10px] text-muted-foreground tracking-wider mb-3">
            THE SOLUTION
          </p>
          <h2 className="font-pixel text-xl sm:text-2xl md:text-3xl mb-4">
            WE BUILD YOUR GROWTH ENGINE.
            <br />
            YOU FOCUS ON REVENUE.
          </h2>
          <p className="text-sm text-muted-foreground mb-12 max-w-lg">
            We take OpenClaw, configure it for your exact market, and run it for
            you. You get a pipeline. Not a project.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                title: "READY-TO-CLOSE OPPORTUNITIES",
                desc: "Not raw contacts. Qualified, scored, verified prospects that match your ideal customer profile. Ready for a conversation.",
              },
              {
                title: "LIVE STRATEGY CONTROL",
                desc: "Adjust targeting, positioning, and outreach priorities in real-time. Talk to your growth operator like a teammate. It adapts instantly.",
              },
              {
                title: "COMPOUNDING RESULTS",
                desc: "The system learns from every win and every pass. Month 3 is dramatically better than month 1. Your pipeline compounds.",
              },
              {
                title: "DIRECT LINE TO THE FOUNDER",
                desc: "I personally help you nail your strategy and make sure you see results. Not a support ticket. Not a chatbot. A real conversation with the person who built this.",
              },
            ].map((item) => (
              <div key={item.title} className="border border-border p-5">
                <h3 className="font-pixel text-xs tracking-wider mb-2">
                  {item.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 px-6 bg-background">
        <div className="max-w-3xl mx-auto">
          <p className="font-pixel text-[10px] text-muted-foreground tracking-wider mb-3">
            HOW IT WORKS
          </p>
          <h2 className="font-pixel text-xl sm:text-2xl mb-12">
            THREE STEPS TO A FULL PIPELINE.
          </h2>

          <div className="space-y-10">
            {[
              {
                num: "01",
                title: "APPLY FOR ACCESS",
                desc: "Tell us about your business, your market, and who you want to reach. We review every application. This isn't for everyone.",
              },
              {
                num: "02",
                title: "STRATEGY CALL",
                desc: "We get on a call. Define your ideal buyer together. What signals matter. What conversations you want. I configure your growth engine personally.",
              },
              {
                num: "03",
                title: "PIPELINE FILLS UP",
                desc: "Qualified opportunities start landing in your inbox daily. Adjust the strategy anytime. Watch your pipeline compound week over week.",
              },
            ].map((step) => (
              <div key={step.num} className="flex gap-6 items-start">
                <span className="font-pixel text-4xl sm:text-5xl text-muted-foreground/20 leading-none shrink-0">
                  {step.num}
                </span>
                <div>
                  <h3 className="font-pixel text-[11px] tracking-wider mb-1.5">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY LIMITED ── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="font-pixel text-[10px] text-muted-foreground tracking-wider mb-3">
            WHY WE CAP ACCESS
          </p>
          <h2 className="font-pixel text-xl sm:text-2xl mb-4">
            WE REJECT 70% OF APPLICATIONS.
          </h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-lg leading-relaxed">
            This is for founders already generating revenue who want to scale
            their pipeline without hiring. If you&apos;re pre-revenue or just
            exploring, this isn&apos;t the right fit.
          </p>
          <p className="text-sm text-muted-foreground mb-12 max-w-lg leading-relaxed">
            We also cap spots per vertical. If too many operators target the
            same market, opportunity quality drops for everyone. Your pipeline
            stays clean, exclusive, and high-converting because we protect it.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                title: "NO OVERLAP",
                desc: "Your prospects aren't being contacted by five other people running the same playbook. Your outreach lands first.",
              },
              {
                title: "HIGHER CLOSE RATES",
                desc: "Exclusive, uncontested opportunities convert dramatically better. Clean pipeline means more revenue per lead.",
              },
              {
                title: "YOUR MARKET IS YOURS",
                desc: "Once your vertical position is locked, nobody else takes it. That competitive advantage compounds over time.",
              },
            ].map((item) => (
              <div key={item.title} className="border border-border p-5">
                <h3 className="font-pixel text-xs tracking-wider mb-2">
                  {item.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="apply" className="py-24 px-6 bg-background">
        <div className="max-w-2xl mx-auto">
          <p className="font-pixel text-[10px] text-muted-foreground tracking-wider mb-3">
            PRICING
          </p>
          <h2 className="font-pixel text-xl sm:text-2xl mb-4">
            ONE SERVICE. LIMITED CAPACITY.
            <br />
            PRICE INCREASES AS WE FILL.
          </h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-lg">
            Early founders lock in lower rates permanently.
          </p>
          <p className="text-sm text-foreground font-pixel mb-12 max-w-lg">
            If this generates 1 customer per month, it pays for itself 5-20x.
          </p>

          <div className="space-y-3">
            {TIERS.map((tier, i) => (
              <div
                key={i}
                className={
                  tier.active
                    ? "border-2 border-foreground bg-foreground text-background p-5"
                    : "border border-border text-muted-foreground p-5"
                }
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <span className="font-pixel text-xs tracking-wider">
                      {tier.name}
                    </span>
                    {tier.label && (
                      <Badge
                        variant={tier.active ? "secondary" : "outline"}
                        className="font-pixel text-[9px] tracking-wider"
                      >
                        {tier.label}
                      </Badge>
                    )}
                  </div>
                  <span
                    className={
                      tier.active ? "font-pixel text-xl" : "font-pixel text-lg"
                    }
                  >
                    {tier.price}/mo
                  </span>
                </div>
                {tier.active && (
                  <SpotsCounter
                    total={tier.spots}
                    taken={0}
                    inverted
                    className="mt-3"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-10">
            <SecureSpotForm />
            <p className="text-[10px] text-muted-foreground mt-3 font-pixel tracking-wider text-center">
              FOR FOUNDERS ALREADY GENERATING REVENUE
            </p>
          </div>
        </div>
      </section>

      {/* ── UNDER THE HOOD ── */}
      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto">
          <p className="font-pixel text-[10px] text-muted-foreground tracking-wider mb-6 text-center">
            UNDER THE HOOD
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "ENGINE", value: "OpenClaw" },
              { label: "KEYS", value: "BYOK" },
              { label: "INFRA", value: "Isolated" },
              { label: "UPTIME", value: "24/7" },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <p className="font-pixel text-[10px] text-muted-foreground/50 tracking-wider mb-1">
                  {item.label}
                </p>
                <p className="font-pixel text-xs tracking-wider">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <SandFillBg
        eager
        backgroundLayer={<AsciiHourglassBackground />}
        className="py-32 px-6 text-center"
      >
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-center mb-8">
            <HourglassLogo pixelSize={6} />
          </div>

          <h2 className="font-pixel text-2xl sm:text-3xl mb-4 leading-tight">
            ENROLL BEFORE YOUR
            <br />
            <span className="text-muted-foreground">COMPETITOR DOES.</span>
          </h2>

          <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
            Every day without a pipeline is a day your market moves without you.
            One closed deal pays for a full year.
          </p>

          <SecureSpotForm />
        </div>
      </SandFillBg>

      {/* ── FOOTER ── */}
      <footer className="py-8 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HourglassLogo pixelSize={2} />
            <span className="font-pixel text-sm tracking-wider">
              hourglass.bot
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground font-pixel tracking-wider">
            2026
          </span>
        </div>
      </footer>
    </div>
  );
}
