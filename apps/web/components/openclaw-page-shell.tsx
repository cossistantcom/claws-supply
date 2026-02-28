import { ExtraSidebar } from "@/components/extra-sidebar";
import { Menu } from "@/components/section-menu";
import { cn } from "@/lib/utils";

type OpenClawPageShellProps = {
  children: React.ReactNode;
  contentClassName?: string;
};

export function OpenClawPageShell({
  children,
  contentClassName,
}: OpenClawPageShellProps) {
  return (
    <div className="grid w-full grid-cols-1 items-start md:grid-cols-[1fr_minmax(0,56rem)_1fr]">
      <aside className="hidden md:flex sticky top-40 h-[calc(100vh-6rem)] self-start justify-self-start">
        <Menu />
      </aside>
      <div
        className={cn(
          "min-w-0 w-full justify-self-center space-y-10",
          contentClassName,
        )}
      >
        {children}
      </div>
      <aside className="hidden lg:flex sticky top-40 h-[calc(100vh-6rem)] self-start justify-self-end">
        <ExtraSidebar />
      </aside>
    </div>
  );
}
