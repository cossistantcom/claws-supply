import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CliError, EXIT_CODES } from "../src/utils/errors";

vi.mock("../src/lib/api-base", () => ({
  resolveApiBase: vi.fn(() => "https://claws.supply"),
}));

vi.mock("../src/lib/api", () => {
  class ApiHttpError extends Error {
    readonly status: number;
    readonly code?: string;
    readonly endpoint: string;

    constructor(
      message: string,
      options: {
        status: number;
        code?: string;
        endpoint: string;
      },
    ) {
      super(message);
      this.name = "ApiHttpError";
      this.status = options.status;
      this.code = options.code;
      this.endpoint = options.endpoint;
    }
  }

  return {
    ApiHttpError,
    fetchTemplateDetail: vi.fn(),
    downloadTemplateArchive: vi.fn(),
  };
});

vi.mock("../src/lib/auth-store", () => ({
  loadAuthState: vi.fn(),
  requireAuthState: vi.fn(),
}));

vi.mock("../src/commands/auth", () => ({
  runAuthCommand: vi.fn(),
}));

vi.mock("../src/lib/workspace-install", () => ({
  extractWorkspaceInstallEntries: vi.fn(),
  countDirectoryFiles: vi.fn(),
  createWorkspaceStagingDir: vi.fn(),
  stageWorkspaceInstallEntries: vi.fn(),
}));

vi.mock("../src/utils/logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    line: vi.fn(),
    json: vi.fn(),
  })),
  printHeader: vi.fn(),
  formatErrorMessage: vi.fn((summary: string, hint?: string) =>
    hint ? `${summary} ${hint}` : summary,
  ),
}));

vi.mock("../src/utils/spinner", () => ({
  createSpinner: vi.fn(() => ({
    succeed: vi.fn(),
    fail: vi.fn(),
    stop: vi.fn(),
  })),
}));

vi.mock("prompts", () => ({
  default: vi.fn(),
}));

vi.mock("fs-extra", () => ({
  default: {
    pathExists: vi.fn(),
    stat: vi.fn(),
    remove: vi.fn(),
    move: vi.fn(),
  },
}));

import prompts from "prompts";
import fs from "fs-extra";
import { ApiHttpError, downloadTemplateArchive, fetchTemplateDetail } from "../src/lib/api";
import { loadAuthState, requireAuthState } from "../src/lib/auth-store";
import {
  countDirectoryFiles,
  createWorkspaceStagingDir,
  extractWorkspaceInstallEntries,
  stageWorkspaceInstallEntries,
} from "../src/lib/workspace-install";
import { runAuthCommand } from "../src/commands/auth";
import { runUseCommand } from "../src/commands/use";

function setStdoutIsTTY(value: boolean) {
  Object.defineProperty(process.stdout, "isTTY", {
    value,
    configurable: true,
  });
}

const FREE_DETAIL = {
  template: {
    id: "tpl_1",
    slug: "free-template",
    title: "Free Template",
    priceCents: 0,
    currency: "USD",
    version: 1,
    versionNotes: null,
  },
  seller: {
    username: "seller",
    displayName: "Seller",
    avatarUrl: null,
    isVerified: true,
  },
  stats: {
    downloadCount: 10,
    rating: 4.8,
    reviewCount: 12,
  },
  relatedTemplates: [],
};

const PAID_DETAIL = {
  ...FREE_DETAIL,
  template: {
    ...FREE_DETAIL.template,
    slug: "paid-template",
    title: "Paid Template",
    priceCents: 1500,
  },
};

describe("runUseCommand", () => {
  const mockedPrompts = vi.mocked(prompts);
  const mockedFs = vi.mocked(fs);
  const mockedFetchTemplateDetail = vi.mocked(fetchTemplateDetail);
  const mockedDownloadTemplateArchive = vi.mocked(downloadTemplateArchive);
  const mockedLoadAuthState = vi.mocked(loadAuthState);
  const mockedRequireAuthState = vi.mocked(requireAuthState);
  const mockedRunAuthCommand = vi.mocked(runAuthCommand);
  const mockedExtractWorkspaceInstallEntries = vi.mocked(extractWorkspaceInstallEntries);
  const mockedCountDirectoryFiles = vi.mocked(countDirectoryFiles);
  const mockedCreateWorkspaceStagingDir = vi.mocked(createWorkspaceStagingDir);
  const mockedStageWorkspaceInstallEntries = vi.mocked(stageWorkspaceInstallEntries);

  const targetDirectory = path.resolve(process.cwd(), ".openclaw", "workspace");

  beforeEach(() => {
    vi.clearAllMocks();
    setStdoutIsTTY(true);

    mockedFetchTemplateDetail.mockResolvedValue(FREE_DETAIL);
    mockedDownloadTemplateArchive.mockResolvedValue({
      zipBytes: new Uint8Array([1, 2, 3]),
      fileName: "template.zip",
      contentType: "application/zip",
      contentLength: 3,
    });
    mockedLoadAuthState.mockResolvedValue(null);
    mockedExtractWorkspaceInstallEntries.mockReturnValue([
      {
        relativePath: "AGENTS.md",
        bytes: new Uint8Array([1]),
      },
      {
        relativePath: "skills/research.md",
        bytes: new Uint8Array([2]),
      },
    ]);
    mockedCountDirectoryFiles.mockResolvedValue(0);
    mockedCreateWorkspaceStagingDir.mockResolvedValue("/tmp/stage");
    mockedStageWorkspaceInstallEntries.mockResolvedValue(undefined);
    mockedFs.pathExists.mockResolvedValue(false);
    mockedFs.stat.mockResolvedValue({
      isDirectory: () => true,
    } as unknown as Awaited<ReturnType<typeof fs.stat>>);
    mockedFs.remove.mockResolvedValue(undefined);
    mockedFs.move.mockResolvedValue(undefined);
  });

  it("downloads and applies a free template in interactive mode", async () => {
    mockedPrompts.mockResolvedValueOnce({ confirmed: true });

    await runUseCommand("free-template", {});

    expect(mockedDownloadTemplateArchive).toHaveBeenCalledWith({
      baseUrl: "https://claws.supply",
      slug: "free-template",
      token: undefined,
    });
    expect(mockedRunAuthCommand).not.toHaveBeenCalled();
    expect(mockedFs.move).toHaveBeenCalledWith("/tmp/stage", targetDirectory, {
      overwrite: false,
    });
  });

  it("kicks off auth interactively for paid templates without auth state", async () => {
    mockedFetchTemplateDetail.mockResolvedValue(PAID_DETAIL);
    mockedPrompts
      .mockResolvedValueOnce({ confirmed: true })
      .mockResolvedValueOnce({ confirmed: true });
    mockedRequireAuthState.mockResolvedValue({
      accessToken: "token_123",
    } as Awaited<ReturnType<typeof requireAuthState>>);

    await runUseCommand("paid-template", {});

    expect(mockedRunAuthCommand).toHaveBeenCalledTimes(1);
    expect(mockedDownloadTemplateArchive).toHaveBeenCalledWith({
      baseUrl: "https://claws.supply",
      slug: "paid-template",
      token: "token_123",
    });
  });

  it("returns exit code 3 for paid templates without ownership", async () => {
    mockedFetchTemplateDetail.mockResolvedValue(PAID_DETAIL);
    mockedLoadAuthState.mockResolvedValue({
      accessToken: "token_123",
    } as Awaited<ReturnType<typeof loadAuthState>>);
    mockedDownloadTemplateArchive.mockRejectedValue(
      new ApiHttpError("Forbidden.", {
        status: 403,
        endpoint: "https://claws.supply/api/templates/paid-template/download",
      }),
    );

    await expect(
      runUseCommand("paid-template", {
        yes: true,
      }),
    ).rejects.toMatchObject<CliError>({
      exitCode: EXIT_CODES.PAID_TEMPLATE_REQUIRED,
    });
  });

  it("cancels when replace prompt is denied for non-empty workspace", async () => {
    mockedPrompts
      .mockResolvedValueOnce({ confirmed: true })
      .mockResolvedValueOnce({ confirmed: false });
    mockedFs.pathExists.mockResolvedValue(true);
    mockedCountDirectoryFiles.mockResolvedValue(5);

    await expect(runUseCommand("free-template", {})).rejects.toMatchObject<CliError>({
      exitCode: EXIT_CODES.SUCCESS,
    });

    expect(mockedFs.remove).not.toHaveBeenCalled();
    expect(mockedFs.move).not.toHaveBeenCalled();
  });

  it("replaces existing workspace files when replace is confirmed", async () => {
    mockedPrompts
      .mockResolvedValueOnce({ confirmed: true })
      .mockResolvedValueOnce({ confirmed: true });
    mockedFs.pathExists.mockResolvedValue(true);
    mockedCountDirectoryFiles.mockResolvedValue(3);

    await runUseCommand("free-template", {});

    expect(mockedFs.move).toHaveBeenNthCalledWith(
      1,
      targetDirectory,
      expect.stringContaining(".workspace-backup-"),
      { overwrite: false },
    );
    expect(mockedFs.move).toHaveBeenNthCalledWith(
      2,
      "/tmp/stage",
      targetDirectory,
      { overwrite: false },
    );
    expect(mockedFs.remove).toHaveBeenCalledWith(expect.stringContaining(".workspace-backup-"));
  });
});
