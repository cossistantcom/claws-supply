import { CliDeviceAuthPage } from "@/components/auth/cli-device-auth-page";
import { getSessionFromNextHeaders } from "@/lib/auth/session";
import { redirect } from "next/navigation";

type DeviceAuthPageProps = {
  searchParams: Promise<{
    user_code?: string;
  }>;
};

export default async function CliDeviceAuthRoute({ searchParams }: DeviceAuthPageProps) {
  const params = await searchParams;
  const userCode = params.user_code?.trim();

  if (!userCode) {
    return (
      <main className="min-h-screen px-6 pb-16 pt-24 md:px-0">
        <div className="mx-auto w-full max-w-xl space-y-3">
          <h1 className="text-2xl">Authorize CLI Device</h1>
          <p className="text-sm text-red-600">Missing user code.</p>
        </div>
      </main>
    );
  }

  const session = await getSessionFromNextHeaders();
  if (!session) {
    redirect(`/auth/sign-in?next=${encodeURIComponent(`/cli/auth/device?user_code=${userCode}`)}`);
  }

  return <CliDeviceAuthPage userCode={userCode} />;
}
