import fg from "fast-glob";
import path from "node:path";
import picomatch from "picomatch";

export const HARD_EXCLUDE_PATTERNS = [
  ".claws-supply/**",
  ".git/**",
  ".next/**",
  ".turbo/**",
  "dist/**",
  "node_modules/**",
  "coverage/**",
  "*.log",
  "**/*.log",
  "**/.DS_Store",
  "memory/**",
  "**/memory/**",
  "MEMORY.md",
  "**/MEMORY.md",
  ".env",
  ".env.*",
  "**/.env",
  "**/.env.*",
  "credentials/**",
  "**/credentials/**",
  "**/auth-profiles.json",
  "sessions/**",
  "**/sessions/**",
  "logs/**",
  "**/logs/**",
  "sandboxes/**",
  "**/sandboxes/**",
  "**/exec-approvals.json",
  "**/oauth.json",
  "manifest.json",
] as const;

export type FileSelectionGroup = {
  id: string;
  label: string;
  defaultSelected: boolean;
  fileCount: number;
  files: string[];
};

function normalizeRelativePath(value: string): string {
  return value.split(path.sep).join("/").replace(/^\/+/, "");
}

function sortLexical(values: string[]): string[] {
  return [...values].sort((a, b) => a.localeCompare(b));
}

function toGroupLabel(groupKey: string, fileCount: number): string {
  if (groupKey === "__root__") {
    return `Root files (${fileCount})`;
  }

  return `${groupKey}/ (${fileCount})`;
}

function buildGroupId(groupKey: string): string {
  if (groupKey === "__root__") {
    return "group:root";
  }

  return `group:${groupKey}`;
}

function parseGroupId(groupId: string): string {
  if (groupId === "group:root") {
    return "__root__";
  }

  return groupId.replace(/^group:/, "");
}

export async function discoverCandidateFiles(sourceDir: string): Promise<string[]> {
  const files = await fg("**/*", {
    cwd: sourceDir,
    onlyFiles: true,
    dot: true,
    followSymbolicLinks: false,
    ignore: [...HARD_EXCLUDE_PATTERNS],
  });

  return sortLexical(files.map(normalizeRelativePath));
}

export function buildSelectionGroups(files: string[]): FileSelectionGroup[] {
  const grouped = new Map<string, string[]>();

  for (const relativeFile of files) {
    const topLevel = relativeFile.includes("/") ? relativeFile.split("/")[0]! : "__root__";
    const existing = grouped.get(topLevel) ?? [];
    existing.push(relativeFile);
    grouped.set(topLevel, existing);
  }

  const groups: FileSelectionGroup[] = [];
  for (const [key, groupFiles] of grouped.entries()) {
    groups.push({
      id: buildGroupId(key),
      label: toGroupLabel(key, groupFiles.length),
      defaultSelected: key === "__root__" || key === "skills",
      fileCount: groupFiles.length,
      files: sortLexical(groupFiles),
    });
  }

  return groups.sort((a, b) => {
    if (a.id === "group:root") {
      return -1;
    }
    if (b.id === "group:root") {
      return 1;
    }

    return a.id.localeCompare(b.id);
  });
}

function matchAny(file: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    const isMatch = picomatch(pattern, { dot: true });
    if (isMatch(file)) {
      return true;
    }
  }

  return false;
}

export function getDefaultSelectedGroupIds(groups: FileSelectionGroup[]): string[] {
  return groups.filter((group) => group.defaultSelected).map((group) => group.id);
}

export function resolveSelectedFiles(options: {
  files: string[];
  groups: FileSelectionGroup[];
  selectedGroupIds: string[];
  includePatterns: string[];
  excludePatterns: string[];
}): string[] {
  const selected = new Set<string>();
  const selectedGroupKeys = new Set(options.selectedGroupIds.map(parseGroupId));

  for (const group of options.groups) {
    const groupKey = parseGroupId(group.id);
    if (selectedGroupKeys.has(groupKey)) {
      for (const file of group.files) {
        selected.add(file);
      }
    }
  }

  if (options.includePatterns.length > 0) {
    for (const file of options.files) {
      if (matchAny(file, options.includePatterns)) {
        selected.add(file);
      }
    }
  }

  if (options.excludePatterns.length > 0) {
    for (const file of [...selected]) {
      if (matchAny(file, options.excludePatterns)) {
        selected.delete(file);
      }
    }
  }

  return sortLexical([...selected]);
}
