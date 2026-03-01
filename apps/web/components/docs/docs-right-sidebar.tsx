import { SidebarAdStack } from "@/components/ads/sidebar-ad-stack";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const QUICK_ACTIONS = [
  {
    key: "sell-pricing",
    label: "sell + pricing",
    href: "/docs/sell-templates-pricing",
  },
  {
    key: "publish-template",
    label: "publish a template",
    href: "/docs/publish-template",
  },
  {
    key: "verified-seller",
    label: "become verified seller",
    href: "/profile",
  },
  {
    key: "browse-latest",
    label: "browse latest templates",
    href: "/openclaw/templates/latest",
  },
];

export async function DocsRightSidebar() {
  return (
    <div className="sticky top-40 hidden h-[calc(var(--fd-docs-height)-var(--fd-docs-row-1))] w-(--fd-toc-width) [grid-area:toc] flex-col pt-12 pb-2 pr-4 text-xs lg:flex">
      <div className="space-y-4 overflow-y-auto">
        <section className="border border-border bg-background/70 p-3">
          <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
            Quick actions
          </p>
          <div className="mt-3 space-y-2">
            {QUICK_ACTIONS.map((action, index) => (
              <Link href={action.href} key={action.key}>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm lowercase"
                >
                  {action.label}
                  <span className="ml-auto text-primary/50 font-mono text-xs">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </Button>
              </Link>
            ))}
          </div>
        </section>

        <SidebarAdStack />
      </div>
    </div>
  );
}
