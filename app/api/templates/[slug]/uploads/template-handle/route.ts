import { jsonError } from "@/lib/api/response";

export async function POST() {
  return jsonError("Template zip uploads are CLI-only.", {
    code: "CLI_ONLY_ZIP_UPLOAD",
    status: 410,
  });
}
