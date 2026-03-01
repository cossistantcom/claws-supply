import { SectionStyleMenu } from "@/components/navigation/section-style-menu";
import { UploadTemplateMenuCta } from "@/components/upload-template-menu-cta";
import { getSectionMenuItems } from "@/lib/categories";
import { categoryPath, discoveryPath } from "@/lib/routes";
import { getTemplateCountsForMenuCached } from "@/lib/templates/read-service";

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
    <SectionStyleMenu
      items={sectionItems.map((section) => ({
        key: section.key,
        label: section.label,
        href: section.href,
        trailing: section.count,
      }))}
      footer={<UploadTemplateMenuCta />}
    />
  );
}
