"use client";

import { motion } from "motion/react";
import * as React from "react";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type TocItem = {
  title?: React.ReactNode;
  url: string;
  depth: number;
};

type DocsTableOfContentsProps = {
  toc: TocItem[];
  variant?: "dropdown" | "list";
  className?: string;
};

function useActiveItem(itemIds: string[]) {
  const [activeId, setActiveId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "0% 0% -80% 0%" },
    );

    for (const id of itemIds) {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    }

    return () => {
      for (const id of itemIds) {
        const element = document.getElementById(id);
        if (element) {
          observer.unobserve(element);
        }
      }
    };
  }, [itemIds]);

  return activeId;
}

export function DocsTableOfContents({
  toc,
  variant = "list",
  className,
}: DocsTableOfContentsProps) {
  const [open, setOpen] = React.useState(false);
  const itemIds = React.useMemo(
    () => toc.map((item) => item.url.replace("#", "")),
    [toc],
  );
  const activeHeading = useActiveItem(itemIds);

  if (!toc.length) {
    return null;
  }

  if (variant === "dropdown") {
    return (
      <DropdownMenu onOpenChange={setOpen} open={open}>
        <DropdownMenuTrigger
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-8 md:h-7",
            className,
          )}
        >
          On this page
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-[70svh]">
          {toc.map((item) => (
            <DropdownMenuItem
              className="data-[depth=3]:pl-6 data-[depth=4]:pl-8"
              data-depth={item.depth}
              key={item.url}
              onClick={() => {
                setOpen(false);
                const itemId = item.url.replace("#", "");
                const element = document.getElementById(itemId);

                if (element) {
                  element.scrollIntoView({ behavior: "smooth", block: "start" });
                }

                window.history.replaceState(null, "", item.url);
              }}
            >
              {item.title}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2 p-4 pt-0 text-sm", className)}>
      <p className="sticky top-0 h-6 bg-background font-medium text-primary/80 text-xs uppercase">
        On this page
      </p>
      {toc.map((item) => (
        <a
          className="relative text-[0.8rem] text-muted-foreground no-underline transition-colors hover:text-foreground data-[depth=3]:pl-4 data-[depth=4]:pl-6 data-[active=true]:text-foreground"
          data-active={item.url === `#${activeHeading}`}
          data-depth={item.depth}
          href={item.url}
          key={item.url}
        >
          {item.url === `#${activeHeading}` ? (
            <motion.div className="-left-5 absolute top-1.5" layoutId="toc-active-dot">
              <span className="block size-2 rounded-full bg-cossistant-green" />
            </motion.div>
          ) : null}
          {item.title}
        </a>
      ))}
    </div>
  );
}
