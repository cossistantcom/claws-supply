import { describe, expect, it } from "vitest";
import { resolveApiBase } from "../src/lib/api-base";
import { DEFAULT_API_BASE, LOCAL_DEV_API_BASE } from "../src/lib/constants";

describe("resolveApiBase", () => {
  it("returns production API by default", () => {
    expect(resolveApiBase()).toBe(DEFAULT_API_BASE);
    expect(resolveApiBase(false)).toBe(DEFAULT_API_BASE);
  });

  it("returns local API in dev mode", () => {
    expect(resolveApiBase(true)).toBe(LOCAL_DEV_API_BASE);
  });
});
