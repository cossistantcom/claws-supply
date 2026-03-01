import os from "node:os";
import path from "node:path";
import { BUILD_STATE_DIRNAME } from "./constants";

export function resolveAuthConfigDir(): string {
  const xdgConfigHome = process.env.XDG_CONFIG_HOME?.trim();
  if (xdgConfigHome) {
    return path.join(xdgConfigHome, "claws-supply");
  }

  return path.join(os.homedir(), ".config", "claws-supply");
}

export function resolveAuthStatePath(): string {
  return path.join(resolveAuthConfigDir(), "auth.json");
}

export function resolveProjectStateDir(cwd = process.cwd()): string {
  return path.join(cwd, BUILD_STATE_DIRNAME);
}

export function resolveBuildRootDir(cwd = process.cwd()): string {
  return path.join(resolveProjectStateDir(cwd), "builds");
}

export function resolveBuildVersionDir(options: {
  cwd?: string;
  slug: string;
  version: number;
}): string {
  return path.join(resolveBuildRootDir(options.cwd), options.slug, `v${options.version}`);
}

export function resolveLatestBuildPointerPath(cwd = process.cwd()): string {
  return path.join(resolveProjectStateDir(cwd), "latest-build.json");
}
