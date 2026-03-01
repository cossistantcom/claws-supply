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
  it("exposes -D/--dev on auth/build/publish", () => {
    for (const name of ["auth", "build", "publish"]) {
      const command = requireCommand(name);
      const devOption = command.options.find((option) => option.long === "--dev");
      expect(devOption).toBeTruthy();
      expect(devOption?.short).toBe("-D");
    }
  });

  it("does not expose --api-base anymore", () => {
    for (const name of ["auth", "build", "publish"]) {
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
});
