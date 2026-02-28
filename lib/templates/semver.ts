function assertIntegerVersion(version: number) {
  if (!Number.isInteger(version) || version < 1) {
    throw new Error("Version must be a positive integer.");
  }
}

export function compareVersion(a: number, b: number): number {
  assertIntegerVersion(a);
  assertIntegerVersion(b);

  if (a === b) {
    return 0;
  }

  return a > b ? 1 : -1;
}

export function isVersionGreater(nextVersion: number, currentVersion: number): boolean {
  return compareVersion(nextVersion, currentVersion) > 0;
}
