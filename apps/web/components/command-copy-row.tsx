import { CopyButton } from "@/components/ui/copy-button";
import { cn } from "@/lib/utils";

type CommandCopyRowProps = {
  label: string;
  command: string;
  className?: string;
};

export function CommandCopyRow({
  label,
  command,
  className,
}: CommandCopyRowProps) {
  return (
    <article className={cn("space-y-2 mt-4", className)}>
      <h2 className="font-pixel text-xs tracking-widest uppercase text-foreground/90">
        {label}
      </h2>
      <div className="flex min-w-0 items-center gap-2 rounded border border-border bg-primary/10 p-2 sm:p-3">
        <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap px-2 text-sm sm:text-base">
          $ {command}
        </code>
        <CopyButton value={command} ariaLabel={`Copy command for ${label}`} />
      </div>
    </article>
  );
}
