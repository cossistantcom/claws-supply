import Link from "next/link";
import { Button } from "@/components/ui/button";

type UploadTemplateMenuCtaProps = {
  isLoggedIn: boolean;
};

export function UploadTemplateMenuCta({ isLoggedIn }: UploadTemplateMenuCtaProps) {
  const uploadHref = isLoggedIn ? "/profile" : "/auth/sign-up?next=/profile";

  return (
    <div className="pixel-ui px-1.5">
      <Link href={uploadHref}>
        <Button className="w-full justify-start text-sm tracking-wider h-8 text-center items-center justify-center font-mono">
          UPLOAD YOUR TEMPLATE
        </Button>
      </Link>
    </div>
  );
}
