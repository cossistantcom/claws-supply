import { describe, expect, test } from "bun:test";
import type { BotInstanceRecord } from "@/lib/bot/repository";
import {
  executeRailwayDeployAction,
  resolveDeployAction,
  type DeployRailwayOps,
} from "@/lib/bot/service";

const RAILWAY_CONFIG = {
  endpoint: "https://backboard.railway.app/graphql/v2",
  token: "token",
  projectId: "project-id",
  environmentId: "env-id",
  botImage: "ghcr.io/hourglass/clawbot:test",
};

function createBotRecord(overrides: Partial<BotInstanceRecord> = {}): BotInstanceRecord {
  return {
    id: "bot-1",
    organizationId: "org-1",
    railwayProjectId: "project-id",
    railwayEnvironmentId: "env-id",
    railwayServiceId: null,
    railwayServiceName: null,
    railwayDeploymentId: null,
    imageRef: RAILWAY_CONFIG.botImage,
    status: "not_deployed",
    successUrl: null,
    lastRailwayStatus: null,
    lastError: null,
    deployedAt: null,
    deletedAt: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("resolveDeployAction", () => {
  test("returns already_live for live bots", () => {
    const action = resolveDeployAction(
      createBotRecord({ status: "live", railwayServiceId: "svc_1" }),
    );
    expect(action).toBe("already_live");
  });

  test("returns already_in_progress for provisioning/deploying bots", () => {
    expect(
      resolveDeployAction(createBotRecord({ status: "provisioning" })),
    ).toBe("already_in_progress");
    expect(resolveDeployAction(createBotRecord({ status: "deploying" }))).toBe(
      "already_in_progress",
    );
  });

  test("returns redeploying when service exists but not live", () => {
    const action = resolveDeployAction(
      createBotRecord({ status: "failed", railwayServiceId: "svc_1" }),
    );
    expect(action).toBe("redeploying");
  });
});

describe("executeRailwayDeployAction", () => {
  test("create path provisions service then deploys", async () => {
    const calls: string[] = [];

    const operations: DeployRailwayOps = {
      async createRailwayServiceFromImage() {
        calls.push("create");
        return { id: "svc_new", name: "clawbot-org-1" };
      },
      async updateRailwayServiceImage() {
        calls.push("update-image");
      },
      async upsertRailwayServiceVariables() {
        calls.push("upsert-vars");
      },
      async deployRailwayService() {
        calls.push("deploy");
        return { deploymentId: "dep_new" };
      },
    };

    const persisted: Array<{ organizationId: string; serviceId: string }> = [];

    const result = await executeRailwayDeployAction(
      {
        action: "created_and_deploying",
        context: { organizationId: "org-1" },
        botRecord: createBotRecord(),
        railwayConfig: RAILWAY_CONFIG,
      },
      operations,
      {
        persistCreatedServiceDetails: async (input) => {
          persisted.push({
            organizationId: input.organizationId,
            serviceId: input.serviceId,
          });
        },
      },
    );

    expect(result.deploymentId).toBe("dep_new");
    expect(calls).toEqual(["create", "update-image", "upsert-vars", "deploy"]);
    expect(persisted).toEqual([
      {
        organizationId: "org-1",
        serviceId: "svc_new",
      },
    ]);
  });

  test("redeploy path skips create service", async () => {
    const calls: string[] = [];

    const operations: DeployRailwayOps = {
      async createRailwayServiceFromImage() {
        calls.push("create");
        return { id: "svc_should_not_exist", name: "should-not-run" };
      },
      async updateRailwayServiceImage() {
        calls.push("update-image");
      },
      async upsertRailwayServiceVariables() {
        calls.push("upsert-vars");
      },
      async deployRailwayService() {
        calls.push("deploy");
        return { deploymentId: "dep_redeploy" };
      },
    };

    const result = await executeRailwayDeployAction(
      {
        action: "redeploying",
        context: { organizationId: "org-1" },
        botRecord: createBotRecord({
          railwayServiceId: "svc_existing",
          status: "failed",
        }),
        railwayConfig: RAILWAY_CONFIG,
      },
      operations,
      {
        persistCreatedServiceDetails: async () => {
          calls.push("persist-created");
        },
      },
    );

    expect(result.deploymentId).toBe("dep_redeploy");
    expect(calls).toEqual(["update-image", "upsert-vars", "deploy"]);
  });
});
