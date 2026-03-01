import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export type SectionStyleMenuItem = {
  key: string;
  label: string;
  href: string;
  trailing?: string | number;
  active?: boolean;
};

type SectionStyleMenuProps = {
  items: SectionStyleMenuItem[];
  title?: string;
  titleClassName?: string;
  itemClassName?: string;
  footer?: React.ReactNode;
  className?: string;
};

export function SectionStyleMenu({
  items,
  title,
  titleClassName,
  itemClassName,
  footer,
  className,
}: SectionStyleMenuProps) {
  return (
    <aside className={cn("w-80 p-4 flex flex-col z-[9999]", className)}>
      <div className="flex-grow overflow-y-auto">
        <div className="space-y-4">
          <div className="space-y-2">
            {title ? (
              <p
                className={cn(
                  "px-2 text-[11px] tracking-wide text-muted-foreground",
                  titleClassName,
                )}
              >
                {title}
              </p>
            ) : null}
            {items.map((item) => (
              <Link href={item.href} key={item.key}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-sm",
                    itemClassName,
                    item.active ? "bg-muted" : "",
                  )}
                >
                  {item.label}
                  {item.trailing !== undefined ? (
                    <span className="ml-auto text-primary/50 font-mono text-xs">
                      {item.trailing}
                    </span>
                  ) : null}
                </Button>
              </Link>
            ))}
          </div>
          {footer}
        </div>
      </div>
    </aside>
  );
}
