import { ImageResponse } from "next/og";

export const runtime = "edge";

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const DEFAULT_TITLE = "Claws.supply";
const DEFAULT_DESCRIPTION = "OpenClaw AI agent template marketplace.";

function truncateText(value: string, maxLength: number) {
  const normalized = value.trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(maxLength - 1, 1)).trimEnd()}…`;
}

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = truncateText(searchParams.get("title") ?? DEFAULT_TITLE, 110);
  const description = truncateText(
    searchParams.get("description") ?? DEFAULT_DESCRIPTION,
    180,
  );

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
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            padding: "56px 64px",
            position: "relative",
          }}
        >
          <div
            style={{
              fontSize: 26,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#f97316",
              fontWeight: 700,
            }}
          >
            claws.supply
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 980 }}>
            <div
              style={{
                fontSize: title.length > 60 ? 58 : 70,
                lineHeight: 1.08,
                fontWeight: 700,
                letterSpacing: "-0.02em",
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: 34,
                lineHeight: 1.25,
                color: "#d4d4d8",
                letterSpacing: "-0.01em",
              }}
            >
              {description}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: OG_WIDTH,
      height: OG_HEIGHT,
    },
  );
}
