import fs from "fs-extra";
import { z } from "zod";
import { CliError, EXIT_CODES } from "../utils/errors";
import { resolveAuthConfigDir, resolveAuthStatePath } from "./paths";

export const AuthStateSchema = z.object({
  version: z.literal(1),
  apiBase: z.string().url().optional(),
  clientId: z.string().min(1),
  accessToken: z.string().min(1),
  tokenType: z.string().min(1),
  publisherHash: z.string().regex(/^[a-f0-9]{64}$/),
  createdAt: z.string().datetime({ offset: true }),
  expiresAt: z.string().datetime({ offset: true }).optional(),
});

export type AuthState = z.infer<typeof AuthStateSchema>;

async function ensureAuthPermissions(filePath: string) {
  const dir = resolveAuthConfigDir();
  await fs.ensureDir(dir);

  try {
    await fs.chmod(dir, 0o700);
  } catch {
    // Best effort on non-POSIX filesystems.
  }

  try {
    await fs.chmod(filePath, 0o600);
  } catch {
    // Best effort on non-POSIX filesystems.
  }
}

export async function saveAuthState(input: AuthState): Promise<string> {
  const filePath = resolveAuthStatePath();
  await fs.ensureDir(resolveAuthConfigDir());
  await fs.writeJson(filePath, input, { spaces: 2 });
  await ensureAuthPermissions(filePath);
  return filePath;
}

export async function loadAuthState(): Promise<AuthState | null> {
  const filePath = resolveAuthStatePath();
  const exists = await fs.pathExists(filePath);
  if (!exists) {
    return null;
  }

  const raw = await fs.readJson(filePath);
  const parsed = AuthStateSchema.safeParse(raw);
  if (!parsed.success) {
    throw new CliError("Stored auth state is invalid. Please re-run `claws-supply auth`.", {
      exitCode: EXIT_CODES.INVALID_INPUT,
    });
  }

  return parsed.data;
}

export async function requireAuthState(): Promise<AuthState> {
  const authState = await loadAuthState();
  if (!authState) {
    throw new CliError("Authentication required. Run `claws-supply auth` first.", {
      exitCode: EXIT_CODES.INVALID_INPUT,
    });
  }

  return authState;
}

export async function clearAuthState(): Promise<{
  removed: boolean;
  path: string;
}> {
  const path = resolveAuthStatePath();
  const exists = await fs.pathExists(path);
  if (!exists) {
    return {
      removed: false,
      path,
    };
  }

  await fs.remove(path);

  return {
    removed: true,
    path,
  };
}
