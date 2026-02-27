import { OpenClawPageShell } from "@/components/openclaw-page-shell";
import { redirect } from "next/navigation";
import { ProfileSettingsPage } from "@/components/profile/profile-settings-page";
import { SignOutButton } from "@/components/profile/sign-out-button";
import { getSessionFromNextHeaders } from "@/lib/auth/session";

export default async function ProfilePage() {
  const session = await getSessionFromNextHeaders();

  if (!session) {
    redirect("/auth/sign-in");
  }

  return (
    <main className="min-h-screen px-6 pb-16 pt-24 md:px-0">
      <OpenClawPageShell contentClassName="flex w-full max-w-3xl flex-col">
        <div className="flex min-h-[calc(100vh-10rem)] flex-col gap-6">
          <ProfileSettingsPage />
          <div className="mt-auto flex justify-end pt-4">
            <SignOutButton />
          </div>
        </div>
      </OpenClawPageShell>
    </main>
  );
}
