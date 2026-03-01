import path from "node:path";
import os from "node:os";
import fs from "fs-extra";
import { describe, expect, it } from "vitest";
import {
  buildSelectionGroups,
  discoverCandidateFiles,
  getDefaultSelectedGroupIds,
  resolveSelectedFiles,
} from "../src/lib/file-selection";
import { createTemplateArchive, extractManifestFromZipBytes } from "../src/lib/archive";

describe("build pipeline", () => {
  it("excludes memory and secret files from candidate discovery", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "claws-cli-build-"));

    await fs.writeFile(path.join(dir, "AGENTS.md"), "hello");
    await fs.ensureDir(path.join(dir, "skills"));
    await fs.writeFile(path.join(dir, "skills", "skill.md"), "skill");
    await fs.ensureDir(path.join(dir, "memory"));
    await fs.writeFile(path.join(dir, "memory", "secret.md"), "secret");
    await fs.writeFile(path.join(dir, ".env"), "TOKEN=abc");

    const files = await discoverCandidateFiles(dir);
    expect(files).toContain("AGENTS.md");
    expect(files).toContain("skills/skill.md");
    expect(files).not.toContain("memory/secret.md");
    expect(files).not.toContain(".env");

    const groups = buildSelectionGroups(files);
    const selected = resolveSelectedFiles({
      files,
      groups,
      selectedGroupIds: getDefaultSelectedGroupIds(groups),
      includePatterns: [],
      excludePatterns: [],
    });

    expect(selected).toContain("AGENTS.md");
    expect(selected).toContain("skills/skill.md");

    await fs.remove(dir);
  });

  it("creates manifest and deterministic zip with hashes", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "claws-cli-archive-"));

    await fs.writeFile(path.join(dir, "AGENTS.md"), "alpha");
    await fs.ensureDir(path.join(dir, "skills"));
    await fs.writeFile(path.join(dir, "skills", "skill.md"), "beta");

    const archive = await createTemplateArchive({
      sourceDir: dir,
      files: ["AGENTS.md", "skills/skill.md"],
      slug: "demo-template",
      title: "Demo Template",
      publisherHash: "a".repeat(64),
    });

    expect(archive.archiveHash).toMatch(/^[a-f0-9]{64}$/);
    expect(Object.keys(archive.manifest.fileHashes)).toHaveLength(2);

    const parsedManifest = extractManifestFromZipBytes(archive.zipBytes);
    expect(parsedManifest.id).toBe("demo-template");
    expect(parsedManifest.title).toBe("Demo Template");

    await fs.remove(dir);
  });
});
