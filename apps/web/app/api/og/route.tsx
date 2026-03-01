import { ImageResponse } from "next/og";

export const runtime = "edge";

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const TITLE_MAX_LENGTH = 110;
const DESCRIPTION_MAX_LENGTH = 180;
const LOGO_PATH = new URL("./logo.png", import.meta.url);

function truncateText(value: string, maxLength: number) {
  const normalized = value.trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(maxLength - 1, 1)).trimEnd()}…`;
}

function normalizeText(
  value: string | null,
  maxLength: number,
): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim();
  if (normalized.length === 0) {
    return undefined;
  }

  return truncateText(normalized, maxLength);
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(binary);
}

async function loadLogoDataUri(): Promise<string | null> {
  try {
    const response = await fetch(LOGO_PATH);
    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type") ?? "image/png";
    const arrayBuffer = await response.arrayBuffer();
    const base64 = arrayBufferToBase64(arrayBuffer);
    return `data:${contentType};base64,${base64}`;
  } catch {
    return null;
  }
}

const logoDataUriPromise = loadLogoDataUri();

function getTitleFontSize(titleLength: number, hasDescription: boolean) {
  if (!hasDescription) {
    if (titleLength <= 32) return 88;
    if (titleLength <= 56) return 76;
    if (titleLength <= 84) return 66;
    return 58;
  }

  if (titleLength <= 28) return 74;
  if (titleLength <= 54) return 64;
  if (titleLength <= 80) return 56;
  return 50;
}

function getDescriptionFontSize(
  descriptionLength: number,
  hasTitle: boolean,
) {
  if (!hasTitle) {
    if (descriptionLength <= 80) return 46;
    if (descriptionLength <= 130) return 40;
    return 34;
  }

  if (descriptionLength <= 84) return 34;
  if (descriptionLength <= 136) return 30;
  return 27;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = normalizeText(searchParams.get("title"), TITLE_MAX_LENGTH);
  const description = normalizeText(
    searchParams.get("description"),
    DESCRIPTION_MAX_LENGTH,
  );
  const hasText = Boolean(title || description);
  const logoDataUri = await logoDataUriPromise;
  const titleFontSize = title
    ? getTitleFontSize(title.length, Boolean(description))
    : 0;
  const descriptionFontSize = description
    ? getDescriptionFontSize(description.length, Boolean(title))
    : 0;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #070707 0%, #121212 60%, #1e1e1e 100%)",
          color: "#f5f5f5",
          position: "relative",
          fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "120px 120px",
            opacity: 0.25,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(90% 70% at 16% 12%, rgba(249,115,22,0.16) 0%, rgba(249,115,22,0) 58%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: "38px",
            border: "1px solid rgba(245,245,245,0.12)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            position: "relative",
            padding: "56px 64px",
          }}
        >
          {hasText
            ? (
              <>
                {logoDataUri
                  ? (
                    <img
                      src={logoDataUri}
                      alt="Claws.supply logo"
                      style={{
                        position: "absolute",
                        top: 50,
                        left: 56,
                        width: 116,
                        height: 116,
                        objectFit: "contain",
                        border: "1px solid rgba(249,115,22,0.34)",
                        boxShadow: "0 0 0 6px rgba(0,0,0,0.44)",
                        background: "rgba(0,0,0,0.26)",
                      }}
                    />
                  )
                  : (
                    <div
                      style={{
                        position: "absolute",
                        top: 70,
                        left: 64,
                        fontSize: 22,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "#f97316",
                        fontWeight: 700,
                      }}
                    >
                      claws.supply
                    </div>
                  )}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    gap: 16,
                    marginTop: "auto",
                    maxWidth: 1040,
                    paddingBottom: 6,
                  }}
                >
                  {title
                    ? (
                      <div
                        style={{
                          fontSize: titleFontSize,
                          lineHeight: 1.08,
                          fontWeight: 700,
                          letterSpacing: "-0.03em",
                          color: "#fafafa",
                          wordBreak: "break-word",
                        }}
                      >
                        {title}
                      </div>
                    )
                    : null}
                  {description
                    ? (
                      <div
                        style={{
                          fontSize: descriptionFontSize,
                          lineHeight: 1.24,
                          color: "#d6d3d1",
                          letterSpacing: "-0.01em",
                          wordBreak: "break-word",
                        }}
                      >
                        {description}
                      </div>
                    )
                    : null}
                </div>
              </>
            )
            : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  height: "100%",
                }}
              >
                {logoDataUri
                  ? (
                    <img
                      src={logoDataUri}
                      alt="Claws.supply logo"
                      style={{
                        width: 252,
                        height: 252,
                        objectFit: "contain",
                        border: "1px solid rgba(249,115,22,0.4)",
                        boxShadow:
                          "0 0 0 10px rgba(0,0,0,0.42), 0 0 56px rgba(249,115,22,0.2)",
                        background: "rgba(0,0,0,0.28)",
                      }}
                    />
                  )
                  : (
                    <div
                      style={{
                        fontSize: 72,
                        lineHeight: 1.08,
                        fontWeight: 700,
                        letterSpacing: "-0.03em",
                        color: "#fafafa",
                      }}
                    >
                      claws.supply
                    </div>
                  )}
              </div>
            )}
        </div>
      </div>
    ),
    {
      width: OG_WIDTH,
      height: OG_HEIGHT,
    },
  );
}
