import { useId } from "react";
import { cn } from "@/lib/utils";

export function LobsterClawIcon({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const folderBackGradientId = `${uid}-folder-back-gradient`;
  const folderPocketGradientId = `${uid}-folder-pocket-gradient`;
  const folderFlapGradientId = `${uid}-folder-flap-gradient`;
  const folderEdgeGradientId = `${uid}-folder-edge-gradient`;
  const folderShadowFilterId = `${uid}-folder-shadow-filter`;
  const zipTrackGradientId = `${uid}-zip-track-gradient`;
  const zipTeethGradientId = `${uid}-zip-teeth-gradient`;
  const zipPullGradientId = `${uid}-zip-pull-gradient`;
  const bodyGradientId = `${uid}-lobster-body-gradient`;
  const bodyHighlightId = `${uid}-lobster-body-highlight`;
  const bodyRimId = `${uid}-lobster-body-rim`;
  const leftClawGradientId = `${uid}-lobster-left-claw-gradient`;
  const rightClawGradientId = `${uid}-lobster-right-claw-gradient`;
  const clawHighlightId = `${uid}-lobster-claw-highlight`;
  const clawRimId = `${uid}-lobster-claw-rim`;
  const glowFilterId = `${uid}-lobster-glow-filter`;

  return (
    <svg
      className={cn("shrink-0", className)}
      viewBox="10 18 101 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <g filter={`url(#${folderShadowFilterId})`}>
        <path
          d="M10 58 H38 L44 52 H64 V58 H110 V118 H10 Z"
          fill={`url(#${folderBackGradientId})`}
          stroke={`url(#${folderEdgeGradientId})`}
          strokeWidth={1.1}
        />
      </g>

      <g transform="translate(10 14) scale(0.84)">
        <g filter={`url(#${glowFilterId})`}>
          <path
            d="M60 10 C30 10 15 35 15 55 C15 75 30 95 45 100 L45 110 L55 110 L55 100 C55 100 60 102 65 100 L65 110 L75 110 L75 100 C90 95 105 75 105 55 C105 35 90 10 60 10Z"
            fill={`url(#${bodyGradientId})`}
            stroke={`url(#${bodyRimId})`}
            strokeWidth={1.4}
          />
          <path
            d="M60 10 C30 10 15 35 15 55 C15 75 30 95 45 100 L45 110 L55 110 L55 100 C55 100 60 102 65 100 L65 110 L75 110 L75 100 C90 95 105 75 105 55 C105 35 90 10 60 10Z"
            fill={`url(#${bodyHighlightId})`}
            opacity={0.54}
          />

          <path
            d="M20 45 C5 40 0 50 5 60 C10 70 20 65 25 55 C28 48 25 45 20 45Z"
            fill={`url(#${leftClawGradientId})`}
            stroke={`url(#${clawRimId})`}
            strokeWidth={1}
          />
          <path
            d="M100 45 C115 40 120 50 115 60 C110 70 100 65 95 55 C92 48 95 45 100 45Z"
            fill={`url(#${rightClawGradientId})`}
            stroke={`url(#${clawRimId})`}
            strokeWidth={1}
          />
          <path
            d="M20 45 C5 40 0 50 5 60 C10 70 20 65 25 55 C28 48 25 45 20 45Z"
            fill={`url(#${clawHighlightId})`}
            opacity={0.4}
          />
          <path
            d="M100 45 C115 40 120 50 115 60 C110 70 100 65 95 55 C92 48 95 45 100 45Z"
            fill={`url(#${clawHighlightId})`}
            opacity={0.3}
          />
        </g>

        <path
          d="M45 15 Q35 5 30 8"
          stroke="color-mix(in srgb, var(--cossistant-orange) 80%, white)"
          strokeWidth={2.2}
          strokeLinecap="round"
        />
        <path
          d="M45 15 Q35 5 30 8"
          stroke="color-mix(in srgb, var(--cossistant-orange) 55%, black)"
          strokeWidth={1.1}
          strokeLinecap="round"
          opacity={0.7}
        />
        <path
          d="M75 15 Q85 5 90 8"
          stroke="color-mix(in srgb, var(--cossistant-orange) 80%, white)"
          strokeWidth={2.2}
          strokeLinecap="round"
        />
        <path
          d="M75 15 Q85 5 90 8"
          stroke="color-mix(in srgb, var(--cossistant-orange) 55%, black)"
          strokeWidth={1.1}
          strokeLinecap="round"
          opacity={0.7}
        />

        <circle
          cx="45"
          cy="35"
          r="6"
          fill="color-mix(in srgb, var(--cossistant-orange) 40%, black)"
        />
        <circle
          cx="75"
          cy="35"
          r="6"
          fill="color-mix(in srgb, var(--cossistant-orange) 40%, black)"
        />
        <circle
          cx="46"
          cy="34"
          r="1.8"
          fill="color-mix(in srgb, var(--cossistant-orange) 75%, white)"
        />
        <circle
          cx="76"
          cy="34"
          r="1.8"
          fill="color-mix(in srgb, var(--cossistant-orange) 75%, white)"
        />
        <circle
          cx="44"
          cy="36"
          r="0.8"
          fill="color-mix(in srgb, var(--cossistant-orange) 90%, white)"
          opacity={0.75}
        />
        <circle
          cx="74"
          cy="36"
          r="0.8"
          fill="color-mix(in srgb, var(--cossistant-orange) 90%, white)"
          opacity={0.75}
        />
      </g>

      <path
        d="M14 64 H106 V118 H14 Z"
        fill={`url(#${folderPocketGradientId})`}
        stroke={`url(#${folderEdgeGradientId})`}
        strokeWidth={1}
      />
      <path
        d="M10 54 H110 V64 Q60 69 10 64 Z"
        fill={`url(#${folderFlapGradientId})`}
        stroke={`url(#${folderEdgeGradientId})`}
        strokeWidth={1.1}
      />

      <path
        d="M16 61 Q60 66 104 61"
        fill="none"
        stroke={`url(#${zipTrackGradientId})`}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <path
        d="M16 61 Q60 66 104 61"
        fill="none"
        stroke={`url(#${zipTeethGradientId})`}
        strokeWidth={1.35}
        strokeDasharray="1.3 2.6"
        strokeLinecap="round"
      />
      <circle
        cx="103"
        cy="61"
        r="2.2"
        fill="none"
        stroke={`url(#${zipPullGradientId})`}
        strokeWidth={1.2}
      />
      <path
        d="M101.4 62.8 H104.6 A2.2 2.2 0 0 1 106.8 65 V67.4 H101.4 Z"
        fill={`url(#${zipPullGradientId})`}
        stroke={`url(#${zipTrackGradientId})`}
        strokeWidth={0.9}
      />

      <defs>
        <linearGradient
          id={folderBackGradientId}
          x1="10"
          y1="52"
          x2="110"
          y2="118"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0%"
            stopColor="color-mix(in srgb, var(--cossistant-orange) 17%, black)"
          />
          <stop
            offset="100%"
            stopColor="color-mix(in srgb, var(--cossistant-orange) 22%, black)"
          />
        </linearGradient>

        <linearGradient
          id={folderPocketGradientId}
          x1="14"
          y1="64"
          x2="106"
          y2="118"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0%"
            stopColor="color-mix(in srgb, var(--cossistant-orange) 19%, black)"
          />
          <stop
            offset="100%"
            stopColor="color-mix(in srgb, var(--cossistant-orange) 23%, black)"
          />
        </linearGradient>

        <linearGradient
          id={folderFlapGradientId}
          x1="10"
          y1="54"
          x2="110"
          y2="69"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0%"
            stopColor="color-mix(in srgb, var(--cossistant-orange) 20%, black)"
          />
          <stop
            offset="100%"
            stopColor="color-mix(in srgb, var(--cossistant-orange) 24%, black)"
          />
        </linearGradient>

        <linearGradient
          id={folderEdgeGradientId}
          x1="10"
          y1="52"
          x2="110"
          y2="118"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0%"
            stopColor="color-mix(in srgb, var(--cossistant-orange) 30%, white)"
          />
          <stop
            offset="100%"
            stopColor="color-mix(in srgb, var(--cossistant-orange) 24%, black)"
          />
        </linearGradient>

        <linearGradient
          id={zipTrackGradientId}
          x1="16"
          y1="61"
          x2="104"
          y2="61"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0%"
            stopColor="color-mix(in srgb, var(--cossistant-orange) 46%, black)"
          />
          <stop
            offset="100%"
            stopColor="color-mix(in srgb, var(--cossistant-orange) 58%, black)"
          />
        </linearGradient>

        <linearGradient
          id={zipTeethGradientId}
          x1="16"
          y1="61"
          x2="104"
          y2="61"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0%"
            stopColor="color-mix(in srgb, var(--cossistant-orange) 76%, white)"
          />
          <stop
            offset="100%"
            stopColor="color-mix(in srgb, var(--cossistant-orange) 64%, white)"
          />
        </linearGradient>

        <linearGradient
          id={zipPullGradientId}
          x1="101"
          y1="60"
          x2="107"
          y2="68"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0%"
            stopColor="color-mix(in srgb, var(--cossistant-orange) 76%, white)"
          />
          <stop
            offset="100%"
            stopColor="color-mix(in srgb, var(--cossistant-orange) 46%, black)"
          />
        </linearGradient>

        <filter
          id={folderShadowFilterId}
          x="-18%"
          y="-16%"
          width="136%"
          height="140%"
          colorInterpolationFilters="sRGB"
        >
          <feDropShadow
            dx="0"
            dy="0.6"
            stdDeviation="0.9"
            floodColor="color-mix(in srgb, var(--cossistant-orange) 20%, black)"
            floodOpacity="0.2"
          />
          <feDropShadow
            dx="0"
            dy="0"
            stdDeviation="1.8"
            floodColor="color-mix(in srgb, var(--cossistant-orange) 12%, black)"
            floodOpacity="0.08"
          />
        </filter>

        <linearGradient
          id={bodyGradientId}
          x1="24"
          y1="14"
          x2="96"
          y2="108"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0%"
            stopColor="color-mix(in srgb, var(--cossistant-orange) 78%, white)"
          />
          <stop offset="42%" stopColor="var(--cossistant-orange)" />
          <stop
            offset="100%"
            stopColor="color-mix(in srgb, var(--cossistant-orange) 48%, black)"
          />
        </linearGradient>

        <linearGradient
          id={leftClawGradientId}
          x1="6"
          y1="43"
          x2="28"
          y2="66"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0%"
            stopColor="color-mix(in srgb, var(--cossistant-orange) 74%, white)"
          />
          <stop offset="58%" stopColor="var(--cossistant-orange)" />
          <stop
            offset="100%"
            stopColor="color-mix(in srgb, var(--cossistant-orange) 46%, black)"
          />
        </linearGradient>

        <linearGradient
          id={rightClawGradientId}
          x1="114"
          y1="43"
          x2="92"
          y2="66"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0%"
            stopColor="color-mix(in srgb, var(--cossistant-orange) 68%, white)"
          />
          <stop
            offset="56%"
            stopColor="color-mix(in srgb, var(--cossistant-orange) 95%, black)"
          />
          <stop
            offset="100%"
            stopColor="color-mix(in srgb, var(--cossistant-orange) 44%, black)"
          />
        </linearGradient>

        <linearGradient
          id={bodyRimId}
          x1="18"
          y1="12"
          x2="102"
          y2="110"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0%"
            stopColor="color-mix(in srgb, var(--cossistant-orange) 72%, white)"
          />
          <stop
            offset="45%"
            stopColor="color-mix(in srgb, var(--cossistant-orange) 90%, black)"
          />
          <stop
            offset="100%"
            stopColor="color-mix(in srgb, var(--cossistant-orange) 52%, black)"
          />
        </linearGradient>

        <linearGradient
          id={clawRimId}
          x1="2"
          y1="42"
          x2="118"
          y2="68"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0%"
            stopColor="color-mix(in srgb, var(--cossistant-orange) 70%, white)"
          />
          <stop
            offset="48%"
            stopColor="color-mix(in srgb, var(--cossistant-orange) 88%, black)"
          />
          <stop
            offset="100%"
            stopColor="color-mix(in srgb, var(--cossistant-orange) 52%, black)"
          />
        </linearGradient>

        <radialGradient
          id={bodyHighlightId}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(50 30) rotate(38) scale(44 31)"
        >
          <stop
            offset="0%"
            stopColor="color-mix(in srgb, var(--cossistant-orange) 88%, white)"
          />
          <stop
            offset="100%"
            stopColor="color-mix(in srgb, var(--cossistant-orange) 88%, white)"
            stopOpacity={0}
          />
        </radialGradient>

        <radialGradient
          id={clawHighlightId}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(60 48) rotate(0) scale(42 16)"
        >
          <stop
            offset="0%"
            stopColor="color-mix(in srgb, var(--cossistant-orange) 82%, white)"
          />
          <stop
            offset="100%"
            stopColor="color-mix(in srgb, var(--cossistant-orange) 82%, white)"
            stopOpacity={0}
          />
        </radialGradient>

        <filter
          id={glowFilterId}
          x="-22%"
          y="-20%"
          width="144%"
          height="156%"
          colorInterpolationFilters="sRGB"
        >
          <feDropShadow
            dx="0"
            dy="0.7"
            stdDeviation="1.1"
            floodColor="color-mix(in srgb, var(--cossistant-orange) 62%, black)"
            floodOpacity="0.32"
          />
          <feDropShadow
            dx="0"
            dy="0"
            stdDeviation="2.4"
            floodColor="color-mix(in srgb, var(--cossistant-orange) 70%, black)"
            floodOpacity="0.14"
          />
        </filter>
      </defs>
    </svg>
  );
}
