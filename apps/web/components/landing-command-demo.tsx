import { CommandCopyRow } from "@/components/command-copy-row";

export function LandingCommandDemo() {
  return (
    <section
      className="w-full max-w-xl gap-6 flex items-center"
      aria-label="Quick template command demo"
    >
      <CommandCopyRow
        label="TRY IT NOW"
        command="npx claws-supply use <template-slug>"
      />
      <CommandCopyRow
        label="CREATE YOUR TEMPLATE"
        command="npx claws-supply build"
      />
    </section>
  );
}
