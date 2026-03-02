import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CliError, EXIT_CODES } from "../src/utils/errors";

vi.mock("prompts", () => ({
  default: vi.fn(),
}));

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

import prompts from "prompts";
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
const originalStdoutIsTTY = process.stdout.isTTY;

function setStdoutIsTTY(value: boolean | undefined) {
  Object.defineProperty(process.stdout, "isTTY", {
    value,
    configurable: true,
  });
}

describe("runBuildCommand metadata prompts", () => {
  const mockedPrompts = vi.mocked(prompts);

  beforeEach(() => {
    vi.clearAllMocks();
    setStdoutIsTTY(true);

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

    vi.mocked(createTemplateArchive).mockImplementation(async (options) => ({
      archiveHash: ARCHIVE_HASH,
      zipBytes: new Uint8Array([1, 2, 3]),
      manifest: {
        id: options.slug,
        version: 1,
        title: options.title,
        publisherHash: PUBLISHER_HASH,
        publishedAt: CREATED_AT,
        fileHashes: {
          "AGENTS.md": FILE_HASH,
        },
      },
    }));

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

  afterEach(() => {
    setStdoutIsTTY(originalStdoutIsTTY);
  });

  it("asks title first, then defaults slug from entered title", async () => {
    const sourceDir = await fs.mkdtemp(path.join(os.tmpdir(), "claws-build-metadata-"));

    mockedPrompts
      .mockResolvedValueOnce({ title: "My Fresh Template" })
      .mockResolvedValueOnce({ slug: "my-fresh-template" })
      .mockResolvedValueOnce({ groupIds: ["default"] });

    try {
      await runBuildCommand({ source: sourceDir });

      const [titlePrompt, slugPrompt] = mockedPrompts.mock.calls.map((call) => call[0]);

      expect(titlePrompt).toMatchObject({
        name: "title",
        message: "Template title",
        initial: path.basename(sourceDir),
      });
      expect(slugPrompt).toMatchObject({
        name: "slug",
        message: "Template slug",
        initial: "my-fresh-template",
      });
      expect(saveBuildArtifact).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "My Fresh Template",
          slug: "my-fresh-template",
        }),
      );
    } finally {
      await fs.remove(sourceDir);
    }
  });

  it("keeps provided --slug as slug prompt default", async () => {
    const sourceDir = await fs.mkdtemp(path.join(os.tmpdir(), "claws-build-metadata-"));

    mockedPrompts
      .mockResolvedValueOnce({ title: "Any Interactive Title" })
      .mockResolvedValueOnce({ slug: "provided-slug" })
      .mockResolvedValueOnce({ groupIds: ["default"] });

    try {
      await runBuildCommand({
        source: sourceDir,
        slug: "provided-slug",
      });

      const [, slugPrompt] = mockedPrompts.mock.calls.map((call) => call[0]);
      expect(slugPrompt).toMatchObject({
        name: "slug",
        initial: "provided-slug",
      });
    } finally {
      await fs.remove(sourceDir);
    }
  });

  it("still prompts for title when --title is provided and defaults slug from entered title", async () => {
    const sourceDir = await fs.mkdtemp(path.join(os.tmpdir(), "claws-build-metadata-"));

    mockedPrompts
      .mockResolvedValueOnce({ title: "Renamed Title" })
      .mockResolvedValueOnce({ slug: "renamed-title" })
      .mockResolvedValueOnce({ groupIds: ["default"] });

    try {
      await runBuildCommand({
        source: sourceDir,
        title: "Preset Title",
      });

      const [titlePrompt, slugPrompt] = mockedPrompts.mock.calls.map((call) => call[0]);
      expect(titlePrompt).toMatchObject({
        name: "title",
        initial: "Preset Title",
      });
      expect(slugPrompt).toMatchObject({
        name: "slug",
        initial: "renamed-title",
      });
    } finally {
      await fs.remove(sourceDir);
    }
  });

  it("returns canceled when title prompt is canceled", async () => {
    const sourceDir = await fs.mkdtemp(path.join(os.tmpdir(), "claws-build-metadata-"));
    mockedPrompts.mockResolvedValueOnce({});

    try {
      await expect(runBuildCommand({ source: sourceDir })).rejects.toMatchObject<CliError>({
        message: "Build canceled.",
        exitCode: EXIT_CODES.SUCCESS,
      });

      expect(mockedPrompts).toHaveBeenCalledTimes(1);
      expect(checkSlugAvailability).not.toHaveBeenCalled();
    } finally {
      await fs.remove(sourceDir);
    }
  });

  it("returns canceled when slug prompt is canceled", async () => {
    const sourceDir = await fs.mkdtemp(path.join(os.tmpdir(), "claws-build-metadata-"));
    mockedPrompts.mockResolvedValueOnce({ title: "Canceled Slug Template" }).mockResolvedValueOnce({});

    try {
      await expect(runBuildCommand({ source: sourceDir })).rejects.toMatchObject<CliError>({
        message: "Build canceled.",
        exitCode: EXIT_CODES.SUCCESS,
      });

      expect(mockedPrompts).toHaveBeenCalledTimes(2);
      expect(checkSlugAvailability).not.toHaveBeenCalled();
    } finally {
      await fs.remove(sourceDir);
    }
  });
});
