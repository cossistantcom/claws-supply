import { DocsSectionMenu } from "@/components/docs/docs-section-menu";
import { docsLayoutOptions } from "@/lib/docs/layout.shared";
import { source } from "@/lib/source";
import { DocsLayout } from "fumadocs-ui/layouts/docs";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DocsLayout
      tree={source.getPageTree()}
      {...docsLayoutOptions}
      containerProps={{
        className: "md:layout:[--fd-sidebar-width:20rem] lg:layout:[--fd-toc-width:20rem]",
      }}
      sidebar={{
        component: <DocsSectionMenu />,
      }}
    >
      {children}
    </DocsLayout>
  );
}
