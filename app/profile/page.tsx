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
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 pb-24 pt-24">
      <div className="flex justify-end">
        <SignOutButton />
      </div>
      <ProfileSettingsPage />
    </main>
  );
}
