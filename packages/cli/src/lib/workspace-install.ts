import path from "node:path";
import fs from "fs-extra";
import { unzipSync } from "fflate";
import { CliError, EXIT_CODES } from "../utils/errors";

export type WorkspaceInstallEntry = {
  relativePath: string;
  bytes: Uint8Array;
};

function normalizeZipEntryPath(value: string): string {
  return value.replace(/\\/g, "/").replace(/^\/+/, "").trim();
}

function stripWorkspacePrefix(value: string): string {
  if (value === "workspace") {
    return "";
  }

  if (value.startsWith("workspace/")) {
    return value.slice("workspace/".length);
  }

  return value;
}

function assertSafeRelativePath(value: string): string {
  if (value.includes("\0")) {
    throw new CliError(`Unsafe archive entry path: ${value}`, {
      exitCode: EXIT_CODES.INTEGRITY_FAILURE,
    });
  }

  const normalized = path.posix.normalize(value).replace(/^\.\/+/, "");
  if (!normalized || normalized === ".") {
    return "";
  }

  if (
    normalized === ".." ||
    normalized.startsWith("../") ||
    path.posix.isAbsolute(normalized) ||
    /^[a-zA-Z]:\//.test(normalized)
  ) {
    throw new CliError(`Unsafe archive entry path: ${value}`, {
      exitCode: EXIT_CODES.INTEGRITY_FAILURE,
    });
  }

  return normalized;
}

export function extractWorkspaceInstallEntries(
  zipBytes: Uint8Array,
): WorkspaceInstallEntry[] {
  let archiveEntries: Record<string, Uint8Array>;
  try {
    archiveEntries = unzipSync(zipBytes);
  } catch {
    throw new CliError("Template archive is invalid.", {
      exitCode: EXIT_CODES.INTEGRITY_FAILURE,
    });
  }

  const seen = new Set<string>();
  const entries: WorkspaceInstallEntry[] = [];

  for (const [rawPath, bytes] of Object.entries(archiveEntries)) {
    const normalizedRaw = normalizeZipEntryPath(rawPath);
    if (!normalizedRaw || normalizedRaw.endsWith("/")) {
      continue;
    }

    if (normalizedRaw === "manifest.json") {
      continue;
    }

    const withoutWorkspace = stripWorkspacePrefix(normalizedRaw);
    if (!withoutWorkspace) {
      continue;
    }

    const safeRelativePath = assertSafeRelativePath(withoutWorkspace);
    if (!safeRelativePath || safeRelativePath === "manifest.json") {
      continue;
    }

    if (seen.has(safeRelativePath)) {
      throw new CliError(`Template archive contains duplicate install path: ${safeRelativePath}`, {
        exitCode: EXIT_CODES.INTEGRITY_FAILURE,
      });
    }

    seen.add(safeRelativePath);
    entries.push({
      relativePath: safeRelativePath,
      bytes,
    });
  }

  if (entries.length === 0) {
    throw new CliError("Template archive has no installable files.", {
      exitCode: EXIT_CODES.INTEGRITY_FAILURE,
    });
  }

  return entries.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

export async function countDirectoryFiles(directoryPath: string): Promise<number> {
  const exists = await fs.pathExists(directoryPath);
  if (!exists) {
    return 0;
  }

  const stat = await fs.stat(directoryPath);
  if (stat.isFile()) {
    return 1;
  }

  const stack = [directoryPath];
  let count = 0;

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    const children = await fs.readdir(current, { withFileTypes: true });
    for (const child of children) {
      const childPath = path.join(current, child.name);
      if (child.isDirectory()) {
        stack.push(childPath);
      } else if (child.isFile()) {
        count += 1;
      }
    }
  }

  return count;
}

export async function createWorkspaceStagingDir(targetDirectory: string): Promise<string> {
  const parentDirectory = path.dirname(targetDirectory);
  await fs.ensureDir(parentDirectory);
  return fs.mkdtemp(path.join(parentDirectory, ".workspace-staging-"));
}

export async function stageWorkspaceInstallEntries(options: {
  stageDirectory: string;
  entries: WorkspaceInstallEntry[];
}): Promise<void> {
  await fs.ensureDir(options.stageDirectory);
  const normalizedStageDirectory = path.resolve(options.stageDirectory);
  const stagePrefix = `${normalizedStageDirectory}${path.sep}`;

  for (const entry of options.entries) {
    const destination = path.resolve(options.stageDirectory, entry.relativePath);
    if (!destination.startsWith(stagePrefix)) {
      throw new CliError(`Unsafe destination path resolved from archive: ${entry.relativePath}`, {
        exitCode: EXIT_CODES.INTEGRITY_FAILURE,
      });
    }

    await fs.ensureDir(path.dirname(destination));
    await fs.writeFile(destination, entry.bytes);
  }
}

