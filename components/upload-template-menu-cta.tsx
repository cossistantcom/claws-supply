import Link from "next/link";
import { Button } from "@/components/ui/button";

type UploadTemplateMenuCtaProps = {
  isLoggedIn: boolean;
};

export function UploadTemplateMenuCta({
  isLoggedIn,
}: UploadTemplateMenuCtaProps) {
  const uploadHref = isLoggedIn
    ? "/dashboard/templates/new"
    : "/auth/sign-in?next=/dashboard/templates/new";

  return (
    <div className="pixel-ui px-1.5">
      <Link href={uploadHref}>
        <Button className="w-full justify-start text-sm tracking-wider h-10 text-center items-center justify-center">
          UPLOAD YOUR TEMPLATE
        </Button>
      </Link>
    </div>
  );
}
