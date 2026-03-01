import Link from "next/link";
import { Button } from "@/components/ui/button";

export function UploadTemplateMenuCta() {
  const uploadHref = "/openclaw/templates/publish-via-cli";

  return (
    <div className="pixel-ui px-1.5">
      <Link href={uploadHref}>
        <Button
          variant="outline"
          className="w-full justify-start text-xs tracking-wider h-8 text-center items-center justify-center"
        >
          UPLOAD YOUR TEMPLATE
        </Button>
      </Link>
    </div>
  );
}
