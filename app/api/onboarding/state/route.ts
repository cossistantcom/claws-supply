import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-server";
import { parseOnboardingQueryParams } from "@/lib/onboarding/query-params";
import { buildOnboardingState } from "@/lib/onboarding/state";

export async function GET(request: NextRequest) {
  try {
    const query = parseOnboardingQueryParams(request.nextUrl.searchParams);
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    const state = await buildOnboardingState({
      session,
      checkoutHint: query.checkout,
    });

    return NextResponse.json(state, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Failed to resolve onboarding state", error);
    return NextResponse.json(
      {
        error: "Unable to resolve onboarding state.",
      },
      { status: 500 },
    );
  }
}
