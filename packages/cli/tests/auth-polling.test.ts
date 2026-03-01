import { describe, expect, it } from "vitest";
import { ApiHttpError } from "../src/lib/api";
import { classifyAuthPollError } from "../src/lib/auth-polling";

describe("classifyAuthPollError", () => {
  it("continues polling for pending authorization", () => {
    const error = new ApiHttpError("authorization pending", {
      status: 400,
      endpoint: "http://localhost/test",
    });

    const decision = classifyAuthPollError(error);
    expect(decision.action).toBe("continue");
  });

  it("slows down polling for rate limit", () => {
    const error = new ApiHttpError("Too many requests", {
      status: 429,
      endpoint: "http://localhost/test",
      retryAfterSeconds: 5,
    });

    const decision = classifyAuthPollError(error);
    expect(decision.action).toBe("slow_down");
    if (decision.action === "slow_down") {
      expect(decision.delayMs).toBe(5000);
    }
  });

  it("fails for denied authorization", () => {
    const error = new ApiHttpError("access denied", {
      status: 400,
      endpoint: "http://localhost/test",
    });

    const decision = classifyAuthPollError(error);
    expect(decision.action).toBe("fail");
  });
});
