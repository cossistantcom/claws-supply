import { Menu } from "@/components/section-menu";

export function OpenClawPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-6xl gap-8">
      <aside className="hidden md:flex sticky top-24 h-[calc(100vh-6rem)]">
        <Menu />
      </aside>
      <div className="flex-1 min-w-0 space-y-10">{children}</div>
    </div>
  );
}
