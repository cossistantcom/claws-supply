import { Button } from "@/components/ui/button";
import { getSectionMenuItems } from "@/lib/categories";
import {
  getDiscoveryTemplateCount,
  getTemplateCountByCategory,
} from "@/lib/mock/templates";
import { categoryPath, discoveryPath } from "@/lib/routes";
import Link from "next/link";

export function Menu() {
  const categoryCounts = getTemplateCountByCategory();

  const sectionItems = getSectionMenuItems().map((item) =>
    item.type === "discovery"
      ? {
          key: item.slug,
          label: item.label.toLowerCase(),
          href: discoveryPath(item.slug),
          count: getDiscoveryTemplateCount(item.slug),
        }
      : {
          key: item.slug,
          label: item.label.toLowerCase(),
          href: categoryPath(item.slug),
          count: categoryCounts[item.slug] ?? 0,
        },
  );

  return (
    <aside className="w-64 p-4 flex flex-col z-[9999]">
      <div className="flex-grow overflow-y-auto">
        <div className="space-y-2">
          {sectionItems.map((section) => (
            <Link href={section.href} key={section.key}>
              <Button
                variant="ghost"
                className="w-full justify-start text-sm font-pixel"
              >
                {section.label}
                <span className="ml-auto text-primary/50 font-mono text-xs">
                  {section.count}
                </span>
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
