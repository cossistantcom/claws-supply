import { permanentRedirect } from "next/navigation";

export default function OpenClawTemplatesRedirectPage() {
  permanentRedirect("/openclaw/templates/latest");
}
