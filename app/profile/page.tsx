import { redirect } from "next/navigation";
import { ProfileSettingsPage } from "@/components/profile/profile-settings-page";
import { getSessionFromNextHeaders } from "@/lib/auth/session";

export default async function ProfilePage() {
  const session = await getSessionFromNextHeaders();

  if (!session) {
    redirect("/auth/sign-in");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-6 py-24">
      <ProfileSettingsPage />
    </main>
  );
}

