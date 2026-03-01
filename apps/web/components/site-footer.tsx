import Link from "next/link";
import { LobsterClawIcon } from "./lobster-claw";

export function SiteFooter() {
  return (
    <footer className="py-8 px-6">
      <div className="max-w-5xl mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <LobsterClawIcon className="size-10" />
          <span className="font-pixel text-sm tracking-wider uppercase">
            claws.supply
          </span>
        </div>
        <div className="flex items-center gap-4 text-[10px] tracking-wider text-muted-foreground">
          <Link className="hover:text-foreground" href="/advertise">
            ADVERTISE
          </Link>
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
  );
}
