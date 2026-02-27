import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { UploadTemplateMenuCta } from "@/components/upload-template-menu-cta";
import { getSectionMenuItems } from "@/lib/categories";
import { categoryPath, discoveryPath } from "@/lib/routes";
import { getTemplateCountsForMenuCached } from "@/lib/templates/read-service";
import Link from "next/link";

export async function Menu() {
  const counts = await getTemplateCountsForMenuCached();

  const sectionItems = getSectionMenuItems().map((item) =>
    item.type === "discovery"
      ? {
          key: item.slug,
          label: item.label.toLowerCase(),
          href: discoveryPath(item.slug),
          count: counts.discovery[item.slug],
        }
      : {
          key: item.slug,
          label: item.label.toLowerCase(),
          href: categoryPath(item.slug),
          count: counts.categories[item.slug] ?? 0,
        },
  );

  return (
    <aside className="w-64 p-4 flex flex-col z-[9999]">
      <div className="flex-grow overflow-y-auto">
        <div className="space-y-4">
          <UploadTemplateMenuCta />
          <div className="space-y-2">
            {sectionItems.map((section) => (
              <Link href={section.href} key={section.key}>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm"
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
      </div>
    </aside>
  );
}
