import path from "node:path";
import os from "node:os";
import fs from "fs-extra";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/lib/auth-store", () => ({
  requireAuthState: vi.fn(),
}));

vi.mock("../src/lib/api", () => ({
  checkSlugAvailability: vi.fn(),
}));

vi.mock("../src/lib/file-selection", () => ({
  discoverCandidateFiles: vi.fn(),
  buildSelectionGroups: vi.fn(),
  getDefaultSelectedGroupIds: vi.fn(),
  resolveSelectedFiles: vi.fn(),
}));

vi.mock("../src/lib/archive", () => ({
  createTemplateArchive: vi.fn(),
}));

vi.mock("../src/lib/artifact-store", () => ({
  saveBuildArtifact: vi.fn(),
}));

vi.mock("../src/utils/spinner", () => ({
  createSpinner: vi.fn(() => ({
    succeed: vi.fn(),
    fail: vi.fn(),
  })),
}));

vi.mock("../src/utils/logger", () => ({
  createLogger: vi.fn(() => ({
    json: vi.fn(),
    success: vi.fn(),
    line: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
  printHeader: vi.fn(),
}));

import { runBuildCommand } from "../src/commands/build";
import { requireAuthState } from "../src/lib/auth-store";
import { checkSlugAvailability } from "../src/lib/api";
import {
  buildSelectionGroups,
  discoverCandidateFiles,
  getDefaultSelectedGroupIds,
  resolveSelectedFiles,
} from "../src/lib/file-selection";
import { createTemplateArchive } from "../src/lib/archive";
import { saveBuildArtifact } from "../src/lib/artifact-store";

const PUBLISHER_HASH = "a".repeat(64);
const ARCHIVE_HASH = "b".repeat(64);
const FILE_HASH = `sha256:${"c".repeat(64)}`;
const CREATED_AT = "2026-01-01T00:00:00.000Z";

describe("runBuildCommand source resolution", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(requireAuthState).mockResolvedValue({
      accessToken: "token",
      publisherHash: PUBLISHER_HASH,
    });

    vi.mocked(checkSlugAvailability).mockResolvedValue({
      available: true,
    });

    vi.mocked(discoverCandidateFiles).mockResolvedValue(["AGENTS.md"]);
    vi.mocked(buildSelectionGroups).mockReturnValue([{ id: "default", label: "Default", defaultSelected: true }]);
    vi.mocked(getDefaultSelectedGroupIds).mockReturnValue(["default"]);
    vi.mocked(resolveSelectedFiles).mockReturnValue(["AGENTS.md"]);

    vi.mocked(createTemplateArchive).mockResolvedValue({
      archiveHash: ARCHIVE_HASH,
      zipBytes: new Uint8Array([1, 2, 3]),
      manifest: {
        id: "demo-template",
        version: 1,
        title: "Demo Template",
        publisherHash: PUBLISHER_HASH,
        publishedAt: CREATED_AT,
        fileHashes: {
          "AGENTS.md": FILE_HASH,
        },
      },
    });

    vi.mocked(saveBuildArtifact).mockImplementation(async (options) => ({
      version: 1,
      slug: options.slug,
      title: options.title,
      sourceDir: options.sourceDir,
      zipPath: path.join(options.sourceDir, ".claws-supply", "builds", options.slug, "v1", "template-v1.zip"),
      manifestPath: path.join(options.sourceDir, ".claws-supply", "builds", options.slug, "v1", "manifest.json"),
      metadataPath: path.join(options.sourceDir, ".claws-supply", "builds", options.slug, "v1", "artifact.json"),
      archiveHash: options.archiveHash,
      publisherHash: options.publisherHash,
      fileCount: 1,
      createdAt: CREATED_AT,
      includePatterns: options.includePatterns,
      excludePatterns: options.excludePatterns,
    }));
  });

  it("uses process.cwd() when --source is omitted", async () => {
    const originalCwd = process.cwd();
    const cwd = await fs.mkdtemp(path.join(os.tmpdir(), "claws-build-cwd-"));

    try {
      process.chdir(cwd);
      const expectedSourceDir = path.resolve(process.cwd());

      await runBuildCommand({
        title: "Demo Template",
        slug: "demo-template",
        json: true,
      });

      expect(discoverCandidateFiles).toHaveBeenCalledWith(expectedSourceDir);
      expect(createTemplateArchive).toHaveBeenCalledWith(
        expect.objectContaining({ sourceDir: expectedSourceDir }),
      );
      expect(saveBuildArtifact).toHaveBeenCalledWith(
        expect.objectContaining({ sourceDir: expectedSourceDir }),
      );
    } finally {
      process.chdir(originalCwd);
      await fs.remove(cwd);
    }
  });

  it("uses --source path when explicitly provided", async () => {
    const originalCwd = process.cwd();
    const cwd = await fs.mkdtemp(path.join(os.tmpdir(), "claws-build-explicit-cwd-"));
    const sourceDir = path.join(cwd, "target-template");
    await fs.ensureDir(sourceDir);

    try {
      process.chdir(cwd);
      const expectedSourceDir = path.resolve("target-template");

      await runBuildCommand({
        source: "target-template",
        title: "Demo Template",
        slug: "demo-template",
        json: true,
      });

      expect(discoverCandidateFiles).toHaveBeenCalledWith(expectedSourceDir);
      expect(createTemplateArchive).toHaveBeenCalledWith(
        expect.objectContaining({ sourceDir: expectedSourceDir }),
      );
      expect(saveBuildArtifact).toHaveBeenCalledWith(
        expect.objectContaining({ sourceDir: expectedSourceDir }),
      );
    } finally {
      process.chdir(originalCwd);
      await fs.remove(cwd);
    }
  });
});
