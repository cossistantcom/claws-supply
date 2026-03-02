import path from "node:path";
import os from "node:os";
import fs from "fs-extra";
import { zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { CliError } from "../src/utils/errors";
import {
  countDirectoryFiles,
  createWorkspaceStagingDir,
  extractWorkspaceInstallEntries,
  stageWorkspaceInstallEntries,
} from "../src/lib/workspace-install";

describe("workspace install helpers", () => {
  it("strips workspace/ prefix and excludes manifest.json", () => {
    const zipBytes = zipSync({
      "workspace/AGENTS.md": new TextEncoder().encode("agents"),
      "workspace/skills/research.md": new TextEncoder().encode("skill"),
      "manifest.json": new TextEncoder().encode("{\"id\":\"x\"}"),
      "README.md": new TextEncoder().encode("readme"),
    });

    const entries = extractWorkspaceInstallEntries(zipBytes);
    expect(entries.map((entry) => entry.relativePath)).toEqual([
      "AGENTS.md",
      "README.md",
      "skills/research.md",
    ]);
  });

  it("rejects path traversal entries", () => {
    const zipBytes = zipSync({
      "workspace/../../evil.txt": new TextEncoder().encode("evil"),
    });

    expect(() => extractWorkspaceInstallEntries(zipBytes)).toThrow(CliError);
  });

  it("stages files and counts directory files", async () => {
    const targetRoot = await fs.mkdtemp(path.join(os.tmpdir(), "claws-workspace-install-"));
    const targetDir = path.join(targetRoot, ".openclaw", "workspace");
    const stageDir = await createWorkspaceStagingDir(targetDir);

    try {
      await stageWorkspaceInstallEntries({
        stageDirectory: stageDir,
        entries: [
          {
            relativePath: "AGENTS.md",
            bytes: new TextEncoder().encode("agents"),
          },
          {
            relativePath: "skills/research.md",
            bytes: new TextEncoder().encode("skill"),
          },
        ],
      });

      expect(await countDirectoryFiles(stageDir)).toBe(2);
    } finally {
      await fs.remove(targetRoot);
    }
  });
});
