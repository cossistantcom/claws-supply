import { semverRegex } from "./schemas";

function parseSemver(version: string): [number, number, number] {
  if (!semverRegex.test(version)) {
    throw new Error("Version must be a semantic version (x.y.z).");
  }

  const [major, minor, patch] = version.split(".").map(Number);
  return [major, minor, patch];
}

export function compareSemver(a: string, b: string): number {
  const [aMajor, aMinor, aPatch] = parseSemver(a);
  const [bMajor, bMinor, bPatch] = parseSemver(b);

  if (aMajor !== bMajor) {
    return aMajor > bMajor ? 1 : -1;
  }

  if (aMinor !== bMinor) {
    return aMinor > bMinor ? 1 : -1;
  }

  if (aPatch !== bPatch) {
    return aPatch > bPatch ? 1 : -1;
  }

  return 0;
}

export function isSemverGreater(nextVersion: string, currentVersion: string): boolean {
  return compareSemver(nextVersion, currentVersion) > 0;
}
