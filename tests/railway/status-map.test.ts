import { describe, expect, test } from "bun:test";
import { mapRailwayStatusToBotStatus } from "@/lib/railway/status-map";

describe("mapRailwayStatusToBotStatus", () => {
  test("maps provisioning-like statuses to provisioning", () => {
    expect(mapRailwayStatusToBotStatus("BUILDING")).toBe("provisioning");
    expect(mapRailwayStatusToBotStatus("WAITING")).toBe("provisioning");
    expect(mapRailwayStatusToBotStatus("QUEUED")).toBe("provisioning");
  });

  test("maps terminal statuses correctly", () => {
    expect(mapRailwayStatusToBotStatus("SUCCESS")).toBe("live");
    expect(mapRailwayStatusToBotStatus("FAILED")).toBe("failed");
    expect(mapRailwayStatusToBotStatus("CRASHED")).toBe("failed");
    expect(mapRailwayStatusToBotStatus("REMOVED")).toBe("failed");
  });

  test("falls back safely for unknown statuses", () => {
    expect(mapRailwayStatusToBotStatus("UNKNOWN")).toBe("deploying");
    expect(mapRailwayStatusToBotStatus(undefined)).toBe("deploying");
    expect(mapRailwayStatusToBotStatus(null)).toBe("deploying");
  });
});
