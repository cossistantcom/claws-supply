import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearAuthState, saveAuthState } from "../src/lib/auth-store";

const originalXdg = process.env.XDG_CONFIG_HOME;
let tempConfigHome = "";

beforeEach(async () => {
  tempConfigHome = await fs.mkdtemp(path.join(os.tmpdir(), "claws-cli-logout-"));
  process.env.XDG_CONFIG_HOME = tempConfigHome;
});

afterEach(async () => {
  await fs.remove(tempConfigHome);
  if (originalXdg === undefined) {
    delete process.env.XDG_CONFIG_HOME;
    return;
  }

  process.env.XDG_CONFIG_HOME = originalXdg;
});

describe("clearAuthState", () => {
  it("removes existing auth state", async () => {
    await saveAuthState({
      version: 1,
      clientId: "claws-supply-cli",
      accessToken: "token",
      tokenType: "Bearer",
      publisherHash: "a".repeat(64),
      createdAt: new Date().toISOString(),
    });

    const result = await clearAuthState();
    expect(result.removed).toBe(true);
    expect(await fs.pathExists(result.path)).toBe(false);
  });

  it("is idempotent when auth state is missing", async () => {
    const result = await clearAuthState();
    expect(result.removed).toBe(false);
    expect(result.path).toContain("auth.json");
  });
});
