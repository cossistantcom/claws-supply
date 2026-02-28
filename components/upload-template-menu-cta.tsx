import Link from "next/link";
import { Button } from "@/components/ui/button";

export function UploadTemplateMenuCta() {
  const uploadHref = "/openclaw/templates/publish-via-cli";

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
