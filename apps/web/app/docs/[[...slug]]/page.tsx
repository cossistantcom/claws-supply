import { DocsRightSidebar } from "@/components/docs/docs-right-sidebar";
import { getMDXComponents } from "@/mdx-components";
import { buildSeoMetadata } from "@/lib/seo";
import { source } from "@/lib/source";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/page";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type DocsRouteProps = {
  params: Promise<{
    slug?: string[];
  }>;
};

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata({
  params,
}: DocsRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const page = source.getPage(slug);

  if (!page) {
    return buildSeoMetadata({
      title: "Docs Not Found — Claws.supply",
      description: "This documentation page does not exist.",
      path: "/docs",
      noindex: true,
    });
  }

  return buildSeoMetadata({
    title: `${page.data.title} — Claws.supply Docs`,
    description:
      page.data.description ??
      "Practical docs for publishing, using, and selling OpenClaw templates.",
    path: page.url,
  });
}

export default async function DocsPageRoute({ params }: DocsRouteProps) {
  const { slug } = await params;
  const page = source.getPage(slug);

  if (!page) {
    notFound();
  }

  const MdxBody = page.data.body;

  return (
    <DocsPage
      toc={page.data.toc ?? []}
      full={page.data.full}
      tableOfContent={{
        header: <></>,
        component: <DocsRightSidebar tocItems={page.data.toc ?? []} />,
      }}
    >
      <DocsTitle className="mt-20">{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody className="min-h-screen">
        <MdxBody components={getMDXComponents()} />
      </DocsBody>
    </DocsPage>
  );
}
