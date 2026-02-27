const DEFAULT_RAILWAY_GRAPHQL_ENDPOINT =
  "https://backboard.railway.app/graphql/v2";

function readRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value.trim();
}

function readBooleanEnv(name: string, defaultValue: boolean): boolean {
  const value = process.env[name];
  if (!value) {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "1" || normalized === "true" || normalized === "yes") {
    return true;
  }

  if (normalized === "0" || normalized === "false" || normalized === "no") {
    return false;
  }

  return defaultValue;
}

export interface RailwayConfig {
  endpoint: string;
  token: string;
  projectId: string;
  environmentId: string;
  botImage: string;
}

export function isBotDeployEnabled(): boolean {
  return readBooleanEnv("BOT_DEPLOY_ENABLED", true);
}

export function getRailwayConfig(): RailwayConfig {
  return {
    endpoint:
      process.env.RAILWAY_GRAPHQL_ENDPOINT?.trim() ??
      DEFAULT_RAILWAY_GRAPHQL_ENDPOINT,
    token: readRequiredEnv("RAILWAY_API_TOKEN"),
    projectId: readRequiredEnv("RAILWAY_PROJECT_ID"),
    environmentId: readRequiredEnv("RAILWAY_ENVIRONMENT_ID"),
    botImage: readRequiredEnv("RAILWAY_BOT_IMAGE"),
  };
}
