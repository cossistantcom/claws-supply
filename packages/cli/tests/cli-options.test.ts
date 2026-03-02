import { describe, expect, it } from "vitest";
import { createProgram } from "../src/cli";

function requireCommand(name: string) {
  const program = createProgram();
  const command = program.commands.find((candidate) => candidate.name() === name);
  if (!command) {
    throw new Error(`Command not found: ${name}`);
  }

  return command;
}

describe("cli command options", () => {
  it("exposes -D/--dev on auth/build/publish/use", () => {
    for (const name of ["auth", "build", "publish", "use"]) {
      const command = requireCommand(name);
      const devOption = command.options.find((option) => option.long === "--dev");
      expect(devOption).toBeTruthy();
      expect(devOption?.short).toBe("-D");
    }
  });

  it("does not expose --api-base anymore", () => {
    for (const name of ["auth", "build", "publish", "use"]) {
      const command = requireCommand(name);
      const apiBaseOption = command.options.find((option) => option.long === "--api-base");
      expect(apiBaseOption).toBeUndefined();
    }
  });

  it("includes logout command with --json support", () => {
    const logout = requireCommand("logout");
    const jsonOption = logout.options.find((option) => option.long === "--json");
    expect(jsonOption).toBeTruthy();
  });

  it("includes use command flags", () => {
    const use = requireCommand("use");

    const yesOption = use.options.find((option) => option.long === "--yes");
    const clientIdOption = use.options.find((option) => option.long === "--client-id");
    const noOpenOption = use.options.find((option) => option.long === "--no-open");
    const jsonOption = use.options.find((option) => option.long === "--json");

    expect(yesOption).toBeTruthy();
    expect(clientIdOption).toBeTruthy();
    expect(noOpenOption).toBeTruthy();
    expect(jsonOption).toBeTruthy();
  });

  it("keeps build --source runtime-defaulted to cwd", () => {
    const build = requireCommand("build");
    const sourceOption = build.options.find((option) => option.long === "--source");

    expect(sourceOption).toBeTruthy();
    expect(sourceOption?.defaultValue).toBeUndefined();
    expect(sourceOption?.description).toContain("defaults to current working directory");
  });
});
