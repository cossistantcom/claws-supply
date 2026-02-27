import type { RailwayConfig } from "@/lib/config";
import { callRailwayGraphQL, RailwayApiError } from "./client";
import type { RailwayDeployment, RailwayDeploymentStatus, RailwayService } from "./types";

function expectString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new RailwayApiError(`Railway field "${fieldName}" is missing.`);
  }

  return value;
}

function parseDeploymentStatus(value: unknown): RailwayDeploymentStatus {
  if (typeof value !== "string") {
    return "UNKNOWN";
  }

  return value as RailwayDeploymentStatus;
}

function parseDeployment(payload: unknown): RailwayDeployment {
  if (!payload || typeof payload !== "object") {
    throw new RailwayApiError("Deployment payload is missing.");
  }

  const deployment = payload as Record<string, unknown>;
  return {
    id: expectString(deployment.id, "deployment.id"),
    status: parseDeploymentStatus(deployment.status),
    staticUrl:
      typeof deployment.staticUrl === "string" ? deployment.staticUrl : null,
    url: typeof deployment.url === "string" ? deployment.url : null,
  };
}

export async function createRailwayServiceFromImage(
  config: RailwayConfig,
  input: {
    serviceName: string;
    imageRef: string;
  },
): Promise<RailwayService> {
  const data = await callRailwayGraphQL<
    { serviceCreate?: { id?: string; name?: string } },
    {
      projectId: string;
      input: {
        name: string;
        source: {
          image: string;
        };
      };
    }
  >(
    config,
    `
      mutation CreateService($projectId: String!, $input: ServiceCreateInput!) {
        serviceCreate(projectId: $projectId, input: $input) {
          id
          name
        }
      }
    `,
    {
      projectId: config.projectId,
      input: {
        name: input.serviceName,
        source: {
          image: input.imageRef,
        },
      },
    },
  );

  if (!data.serviceCreate) {
    throw new RailwayApiError("Railway did not return a created service.");
  }

  return {
    id: expectString(data.serviceCreate.id, "serviceCreate.id"),
    name: expectString(data.serviceCreate.name, "serviceCreate.name"),
  };
}

export async function upsertRailwayServiceVariables(
  config: RailwayConfig,
  input: {
    serviceId: string;
    variables: Record<string, string>;
  },
): Promise<void> {
  await callRailwayGraphQL<
    { variableCollectionUpsert?: unknown },
    {
      projectId: string;
      environmentId: string;
      serviceId: string;
      variables: Record<string, string>;
      replace: boolean;
    }
  >(
    config,
    `
      mutation UpsertVariables(
        $projectId: String!
        $environmentId: String!
        $serviceId: String!
        $variables: JSON!
        $replace: Boolean
      ) {
        variableCollectionUpsert(
          projectId: $projectId
          environmentId: $environmentId
          serviceId: $serviceId
          variables: $variables
          replace: $replace
        )
      }
    `,
    {
      projectId: config.projectId,
      environmentId: config.environmentId,
      serviceId: input.serviceId,
      variables: input.variables,
      replace: false,
    },
  );
}

export async function updateRailwayServiceImage(
  config: RailwayConfig,
  input: {
    serviceId: string;
    imageRef: string;
  },
): Promise<void> {
  await callRailwayGraphQL<
    { serviceInstanceUpdate?: unknown },
    {
      environmentId: string;
      serviceId: string;
      input: {
        source: {
          image: string;
        };
      };
    }
  >(
    config,
    `
      mutation UpdateServiceImage(
        $environmentId: String!
        $serviceId: String!
        $input: ServiceInstanceUpdateInput!
      ) {
        serviceInstanceUpdate(
          environmentId: $environmentId
          serviceId: $serviceId
          input: $input
        )
      }
    `,
    {
      environmentId: config.environmentId,
      serviceId: input.serviceId,
      input: {
        source: {
          image: input.imageRef,
        },
      },
    },
  );
}

function parseDeployMutationResult(data: Record<string, unknown>): string | null {
  const raw =
    data.serviceInstanceRedeploy ??
    data.serviceInstanceDeploy ??
    data.serviceInstanceDeployV2;

  if (typeof raw === "string" && raw.trim().length > 0) {
    return raw;
  }

  if (raw && typeof raw === "object") {
    const deploymentId = (raw as Record<string, unknown>).deploymentId;
    if (typeof deploymentId === "string" && deploymentId.trim().length > 0) {
      return deploymentId;
    }

    const id = (raw as Record<string, unknown>).id;
    if (typeof id === "string" && id.trim().length > 0) {
      return id;
    }
  }

  return null;
}

export async function deployRailwayService(
  config: RailwayConfig,
  input: {
    serviceId: string;
  },
): Promise<{ deploymentId: string | null }> {
  const data = await callRailwayGraphQL<
    {
      serviceInstanceRedeploy?: unknown;
      serviceInstanceDeploy?: unknown;
      serviceInstanceDeployV2?: unknown;
    },
    {
      environmentId: string;
      serviceId: string;
    }
  >(
    config,
    `
      mutation DeployService($environmentId: String!, $serviceId: String!) {
        serviceInstanceRedeploy(
          environmentId: $environmentId
          serviceId: $serviceId
        )
      }
    `,
    {
      environmentId: config.environmentId,
      serviceId: input.serviceId,
    },
  );

  return {
    deploymentId: parseDeployMutationResult(data as Record<string, unknown>),
  };
}

export async function getRailwayDeployment(
  config: RailwayConfig,
  input: {
    deploymentId: string;
  },
): Promise<RailwayDeployment> {
  const data = await callRailwayGraphQL<
    {
      deployment?: {
        id?: string;
        status?: string;
        staticUrl?: string | null;
        url?: string | null;
      };
    },
    {
      id: string;
    }
  >(
    config,
    `
      query Deployment($id: String!) {
        deployment(id: $id) {
          id
          status
          staticUrl
          url
        }
      }
    `,
    {
      id: input.deploymentId,
    },
  );

  return parseDeployment(data.deployment);
}

export async function getLatestRailwayDeploymentForService(
  config: RailwayConfig,
  input: {
    serviceId: string;
  },
): Promise<RailwayDeployment | null> {
  const data = await callRailwayGraphQL<
    {
      deployments?: {
        edges?: Array<{
          node?: {
            id?: string;
            status?: string;
            staticUrl?: string | null;
            url?: string | null;
          };
        }>;
      };
    },
    {
      serviceId: string;
      environmentId: string;
    }
  >(
    config,
    `
      query LatestDeployment($serviceId: String!, $environmentId: String!) {
        deployments(
          input: {
            serviceId: $serviceId
            environmentId: $environmentId
            first: 1
          }
        ) {
          edges {
            node {
              id
              status
              staticUrl
              url
            }
          }
        }
      }
    `,
    {
      serviceId: input.serviceId,
      environmentId: config.environmentId,
    },
  );

  const node = data.deployments?.edges?.[0]?.node;
  if (!node) {
    return null;
  }

  return parseDeployment(node);
}

export async function deleteRailwayService(
  config: RailwayConfig,
  input: {
    serviceId: string;
  },
): Promise<void> {
  await callRailwayGraphQL<
    { serviceDelete?: unknown },
    {
      id: string;
    }
  >(
    config,
    `
      mutation DeleteService($id: String!) {
        serviceDelete(id: $id)
      }
    `,
    {
      id: input.serviceId,
    },
  );
}
