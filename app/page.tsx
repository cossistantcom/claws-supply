import { Navbar } from "@/components/navbar";
import { AsciiPhoneShowcase } from "@/components/ascii-phone-showcase";
import { AsciiClawsShowcase } from "@/components/claws-showcase";
import { Metadata } from "next";
import { Menu } from "@/components/section-menu";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Claws supply - explore, generate and sell OpenClaw templates",
  description:
    "Quickstart your OpenClaw setup with pre-configured templates and join a community of OpenClaw enthusiasts.",
};

export default async function Page() {
  return (
    <>
      <div className="overflow-x-clip min-h-screen relative mt-40 flex gap-6 px-6 md:px-0">
        <div className="hidden md:flex sticky top-40 h-[calc(100vh-3rem)]">
          <Menu />
        </div>
        <div className="flex flex-col gap-4 w-full max-w-4xl mx-auto">
          <div className="flex items-stretch gap-10">
            <div className="2xl:block hidden aspect-square h-full w-full max-w-40 overflow-clip relative bg-primary/[0.03]">
              <AsciiClawsShowcase />
            </div>
            <div className="flex-1 flex flex-col gap-4">
              <p className="font-pixel text-sm tracking-wide text-primary/80">
                [MADE FOR OPENCLAW ENTHUSIAST 🦞]
              </p>

              <h1 className="font-pixel text-3xl sm:text-3xl md:text-4xl xl:text-5xl leading-[1.3] tracking-tight text-balance">
                Explore and sell vetted OpenClaw templates.
              </h1>

              <p className="text-sm sm:text-base text-muted-foreground max-w-xl leading-relaxed">
                Quickstart your OpenClaw setup with pre-configured templates and
                join a community of OpenClaw enthusiasts.
              </p>
            </div>
          </div>
        </div>
        <aside className="hidden lg:flex sticky top-40 h-[calc(100vh-3rem)] right-0 w-64 gap-4 flex-col pr-6 text-xs">
          <div className="bg-primary/5 flex items-center justify-center w-full h-12">
            advertise here
          </div>
          <div className="bg-primary/5 flex items-center justify-center w-full h-12">
            advertise here
          </div>
          <div className="bg-primary/5 flex items-center justify-center w-full h-12">
            advertise here
          </div>
          <div className="bg-primary/5 flex items-center justify-center w-full h-12">
            advertise here
          </div>
          <div className="bg-primary/5 flex items-center justify-center w-full h-12">
            advertise here
          </div>
        </aside>
      </div>

      {/* ── DAILY BRIEFING PHONE ── */}
      <section className="bg-background overflow-x-clip">
        <div className="relative left-1/2 w-screen -translate-x-1/2">
          <AsciiPhoneShowcase />
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="font-pixel text-sm tracking-wider uppercase">
              claws.supply
            </span>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-pixel tracking-wider text-muted-foreground">
            <Link className="hover:text-foreground" href="/terms">
              TERMS
            </Link>
            <Link className="hover:text-foreground" href="/policy">
              POLICY
            </Link>
            <span>2026</span>
          </div>
        </div>
      </footer>
      <Navbar />
    </>
  );
}
