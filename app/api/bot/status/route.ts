import { NextRequest, NextResponse } from "next/server";
import { BotServiceError, getBotStatus } from "@/lib/bot/service";

function toErrorMessage(error: unknown): string {
  if (error instanceof BotServiceError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Failed to fetch bot status.";
}

function toStatusCode(error: unknown): number {
  if (error instanceof BotServiceError) {
    return error.statusCode;
  }

  return 500;
}

export async function GET(request: NextRequest) {
  try {
    const payload = await getBotStatus(request.headers);
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Bot status failed", error);
    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: toStatusCode(error) },
    );
  }
}
