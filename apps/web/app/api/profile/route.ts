import { jsonError, jsonSuccess, resolveApiError } from "@/lib/api/response";
import { canUserEdit } from "@/lib/auth/permissions";
import { getSessionFromRequest } from "@/lib/auth/session";
import { auth } from "@/lib/auth-server";
import {
  getProfileForUser,
  updateProfileForUser,
  validateProfileUpdateInput,
} from "@/lib/profile/server";

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return jsonError("Unauthorized.", {
      status: 401,
      code: "UNAUTHORIZED",
    });
  }

  try {
    const profile = await getProfileForUser(session.user.id);

    return jsonSuccess(profile);
  } catch (error) {
    const resolvedError = resolveApiError(error, {
      message: "Unable to load profile.",
      code: "PROFILE_FETCH_ERROR",
    });

    return jsonError(resolvedError.message, {
      status: resolvedError.status,
      code: resolvedError.code,
    });
  }
}

export async function PATCH(request: Request) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return jsonError("Unauthorized.", {
      status: 401,
      code: "UNAUTHORIZED",
    });
  }

  if (!canUserEdit(session.user, session.user.id)) {
    return jsonError("Forbidden.", {
      status: 403,
      code: "FORBIDDEN",
    });
  }

  let payload: unknown = null;

  try {
    payload = await request.json();
  } catch {
    return jsonError("Invalid JSON payload.", {
      status: 400,
      code: "INVALID_REQUEST",
    });
  }

  try {
    const validatedInput = validateProfileUpdateInput(payload);
    const profile = await updateProfileForUser(session.user.id, validatedInput);

    return jsonSuccess(profile);
  } catch (error) {
    const resolvedError = resolveApiError(error, {
      message: "Unable to update profile.",
      code: "PROFILE_UPDATE_ERROR",
      status: 400,
    });

    return jsonError(resolvedError.message, {
      status: resolvedError.status,
      code: resolvedError.code,
    });
  }
}

export async function DELETE(request: Request) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return jsonError("Unauthorized.", {
      status: 401,
      code: "UNAUTHORIZED",
    });
  }

  try {
    await auth.api.deleteUser({
      headers: request.headers,
      body: {},
    });

    return jsonSuccess({
      success: true,
    });
  } catch (error) {
    const resolvedError = resolveApiError(error, {
      message:
        "Unable to delete account. Please sign in again and retry this action.",
      code: "ACCOUNT_DELETE_ERROR",
      status: 400,
    });

    return jsonError(resolvedError.message, {
      status: resolvedError.status,
      code: resolvedError.code,
    });
  }
}

