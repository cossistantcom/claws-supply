import { describe, expect, it } from "vitest";
import { toTemplateEditUrl } from "../src/lib/template-url";

describe("toTemplateEditUrl", () => {
  it("appends /edit to a normal template URL", () => {
    expect(toTemplateEditUrl("https://claws.supply/openclaw/template/demo")).toBe(
      "https://claws.supply/openclaw/template/demo/edit",
    );
  });

  it("avoids double slashes when URL already ends with slash", () => {
    expect(toTemplateEditUrl("https://claws.supply/openclaw/template/demo/")).toBe(
      "https://claws.supply/openclaw/template/demo/edit",
    );
  });
});
