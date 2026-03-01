import { createHash } from "node:crypto";

export function sha256Hex(input: Uint8Array | Buffer | string): string {
  const hash = createHash("sha256");
  hash.update(input);
  return hash.digest("hex");
}

export function sha256Label(input: Uint8Array | Buffer | string): string {
  return `sha256:${sha256Hex(input)}`;
}
