import { OpenClawPageShell } from "@/components/openclaw-page-shell";
import { TemplateCreatePage } from "@/components/templates/template-create-page";
import { getSessionFromNextHeaders } from "@/lib/auth/session";
import { redirect } from "next/navigation";

const TEMPLATE_CREATE_ROUTE = "/dashboard/templates/new";

export default async function NewTemplatePage() {
  const session = await getSessionFromNextHeaders();

  if (!session) {
    redirect(`/auth/sign-in?next=${encodeURIComponent(TEMPLATE_CREATE_ROUTE)}`);
  }

  return (
    <main className="min-h-screen px-6 pb-16 pt-24 md:px-0">
      <OpenClawPageShell contentClassName="w-full max-w-4xl">
        <TemplateCreatePage sellerId={session.user.id} />
      </OpenClawPageShell>
    </main>
  );
}
