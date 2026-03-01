import { permanentRedirect } from "next/navigation";

export default function OpenClawRedirectPage() {
  permanentRedirect("/openclaw/templates/latest");
}
