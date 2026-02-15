import { auth } from "@/lib/auth-server";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Generate a strong random password (user won't need to type it)
    const password = crypto.randomBytes(32).toString("base64url");

    // 1. Sign up the user
    const signUpResult = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: name || email.split("@")[0],
      },
    });

    if (!signUpResult?.user) {
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 }
      );
    }

    const user = signUpResult.user;
    const token = signUpResult.token;

    if (!token) {
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      );
    }

    // 2. Create an organization for the user
    const slug = email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 30);

    const orgResult = await auth.api.createOrganization({
      body: {
        name: name || email.split("@")[0],
        slug: `${slug}-${crypto.randomBytes(3).toString("hex")}`,
      },
      headers: new Headers({
        Authorization: `Bearer ${token}`,
      }),
    });

    // 3. Set the new org as active
    if (orgResult?.id) {
      await auth.api.setActiveOrganization({
        body: { organizationId: orgResult.id },
        headers: new Headers({
          Authorization: `Bearer ${token}`,
        }),
      });
    }

    // Return session info + set cookie
    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email },
      organizationId: orgResult?.id,
    });

    // Set the session cookie
    response.cookies.set("better-auth.session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Onboarding error:", error);

    // Handle duplicate email
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    if (message.includes("unique") || message.includes("duplicate")) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
