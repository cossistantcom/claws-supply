"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

const allSections: { slug: string; tag: string; amt: number }[] = [
  {
    slug: "latest",
    tag: "latest",
    amt: 4,
  },
  {
    slug: "popular",
    tag: "popular",
    amt: 45,
  },
  {
    slug: "general",
    tag: "general",
    amt: 12,
  },
  {
    slug: "marketing",
    tag: "marketing",
    amt: 3,
  },
  {
    slug: "coach",
    tag: "coach",
    amt: 12,
  },
  {
    slug: "youtube",
    tag: "youtube",
    amt: 12,
  },
  {
    slug: "seo",
    tag: "seo",
    amt: 12,
  },
  {
    slug: "cofounder",
    tag: "cofounder",
    amt: 12,
  },
  {
    slug: "saas",
    tag: "saas",
    amt: 12,
  },
];

export function Menu() {
  return (
    <aside className="w-64 p-4 flex flex-col z-[9999]">
      <div className="flex-grow overflow-y-auto">
        <div className="space-y-2">
          {allSections.map((section) => (
            <Link href={`/templates/${section.slug}`} key={section.tag}>
              <Button
                variant="ghost"
                className="w-full justify-start text-sm font-pixel"
              >
                {section.tag}
                <span className="ml-auto text-primary/50 font-mono text-xs">
                  {section.amt}
                </span>
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
