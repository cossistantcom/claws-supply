"use client";

import { SectionStyleMenu } from "@/components/navigation/section-style-menu";
import { DOCS_MENU_ITEMS } from "@/lib/docs/menu";
import Link from "next/link";
import { usePathname } from "next/navigation";

function isActiveRoute(pathname: string, href: string) {
  if (href === "/docs") {
    return pathname === "/docs";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DocsSectionMenu() {
  const pathname = usePathname();
  const items = DOCS_MENU_ITEMS.map((item, index) => ({
    key: item.key,
    label: item.label,
    href: item.href,
    trailing: String(index + 1).padStart(2, "0"),
    active: isActiveRoute(pathname, item.href),
  }));

  return (
    <div className="sticky top-40 z-20 hidden h-[calc(var(--fd-docs-height)-var(--fd-docs-row-1))] [grid-area:sidebar] md:flex">
      <SectionStyleMenu
        items={items}
        title="Docs"
        titleClassName="text-lg font-medium tracking-normal text-foreground"
        itemClassName="text-xs"
        className="h-full"
        footer={
          <div className="px-2 pt-2 text-[10px] leading-relaxed text-muted-foreground">
            <p>
              created by anthony riera{" "}
              <Link
                className="underline underline-offset-2"
                href="https://x.com/_anthonyriera"
                rel="noreferrer"
                target="_blank"
              >
                @_anthonyriera on X
              </Link>
            </p>
            <p>
              team:{" "}
              <Link
                className="underline underline-offset-2"
                href="https://cossistant.com"
                rel="noreferrer"
                target="_blank"
              >
                cossistant.com
              </Link>
            </p>
          </div>
        }
      />
    </div>
  );
}
