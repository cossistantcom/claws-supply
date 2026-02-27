import Link from "next/link";

type LegalSection = {
  title: string;
  content: React.ReactNode;
};

type LegalPageLayoutProps = {
  title: string;
  effectiveDate: string;
  sections: LegalSection[];
};

export function LegalPageLayout({
  title,
  effectiveDate,
  sections,
}: LegalPageLayoutProps) {
  return (
    <main className="min-h-screen px-6 py-24">
      <div className="mx-auto w-full max-w-3xl space-y-10">
        <header className="space-y-3 border-b border-border pb-6">
          <p className="font-pixel text-xs tracking-wider text-muted-foreground uppercase">
            Legal
          </p>
          <h1 className="font-pixel text-3xl leading-tight sm:text-4xl">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground">
            Effective date: {effectiveDate}
          </p>
        </header>

        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.title} className="space-y-3">
              <h2 className="font-pixel text-lg sm:text-xl">{section.title}</h2>
              <div className="space-y-4 text-sm leading-7 text-foreground/90">
                {section.content}
              </div>
            </section>
          ))}
        </div>

        <footer className="border-t border-border pt-6">
          <p className="text-xs text-muted-foreground">
            Related legal pages:{" "}
            <Link className="underline underline-offset-4" href="/terms">
              Terms of Service
            </Link>{" "}
            ·{" "}
            <Link className="underline underline-offset-4" href="/policy">
              Privacy Policy
            </Link>
          </p>
        </footer>
      </div>
    </main>
  );
}
