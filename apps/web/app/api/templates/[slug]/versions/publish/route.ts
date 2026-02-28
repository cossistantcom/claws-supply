import { jsonError } from "@/lib/api/response";

export async function POST() {
  return jsonError("Template version uploads are CLI-only.", {
    code: "CLI_ONLY_ZIP_VERSION_UPLOAD",
    status: 410,
  });
}
