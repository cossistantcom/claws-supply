import { useId } from "react";
import { cn } from "@/lib/utils";

export function LobsterClawIcon({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const packageBackGradientId = `${uid}-package-back-gradient`;
  const packageSideGradientId = `${uid}-package-side-gradient`;
  const packageFloorGradientId = `${uid}-package-floor-gradient`;
  const packageFrontGradientId = `${uid}-package-front-gradient`;
  const packageEdgeGradientId = `${uid}-package-edge-gradient`;
  const packageShadowFilterId = `${uid}-package-shadow-filter`;
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
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <g filter={`url(#${packageShadowFilterId})`}>
        <path
          d="M24 34 L60 18 L96 34 L96 86 L24 86 Z"
          fill={`url(#${packageBackGradientId})`}
          stroke={`url(#${packageEdgeGradientId})`}
          strokeWidth={1.1}
          opacity={0.96}
        />
        <path
          d="M24 34 L12 42 L12 94 L24 86 Z"
          fill={`url(#${packageSideGradientId})`}
          stroke={`url(#${packageEdgeGradientId})`}
          strokeWidth={1.1}
          opacity={0.95}
        />
        <path
          d="M96 34 L108 42 L108 94 L96 86 Z"
          fill={`url(#${packageSideGradientId})`}
          stroke={`url(#${packageEdgeGradientId})`}
          strokeWidth={1.1}
          opacity={0.95}
        />
        <path
          d="M24 86 L60 98 L96 86 L60 74 Z"
          fill={`url(#${packageFloorGradientId})`}
          stroke={`url(#${packageEdgeGradientId})`}
          strokeWidth={1.1}
          opacity={0.96}
        />
        <path
          d="M24 34 L60 18 L96 34"
          fill="none"
          stroke={`url(#${packageEdgeGradientId})`}
          strokeWidth={1.1}
          opacity={0.6}
        />
        <path
          d="M60 74 L60 98"
          fill="none"
          stroke="color-mix(in srgb, var(--cossistant-orange) 32%, black)"
          strokeWidth={0.9}
          opacity={0.65}
        />
        <path
          d="M24 86 L12 94"
          fill="none"
          stroke="color-mix(in srgb, var(--cossistant-orange) 32%, black)"
          strokeWidth={0.9}
          opacity={0.65}
        />
        <path
          d="M96 86 L108 94"
          fill="none"
          stroke="color-mix(in srgb, var(--cossistant-orange) 32%, black)"
          strokeWidth={0.9}
          opacity={0.65}
        />
      </g>

      <g transform="translate(15 13) scale(0.75)">
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
        d="M12 94 L60 110 L108 94 L96 86 L60 98 L24 86 Z"
        fill={`url(#${packageFrontGradientId})`}
        stroke={`url(#${packageEdgeGradientId})`}
        strokeWidth={1.1}
        opacity={0.98}
      />
      <path
        d="M24 86 L60 98 L96 86"
        fill="none"
        stroke="color-mix(in srgb, var(--cossistant-orange) 32%, black)"
        strokeWidth={0.9}
        opacity={0.65}
      />
      <path
        d="M60 98 L60 110"
        fill="none"
        stroke="color-mix(in srgb, var(--cossistant-orange) 32%, black)"
        strokeWidth={0.9}
        opacity={0.65}
      />
      <path
        d="M12 94 L60 110 L108 94"
        fill="none"
        stroke={`url(#${packageEdgeGradientId})`}
        strokeWidth={1.1}
        opacity={0.6}
      />

      <defs>
        <linearGradient
          id={packageBackGradientId}
          x1="24"
          y1="18"
          x2="96"
          y2="86"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0%"
            stopColor="color-mix(in srgb, var(--cossistant-orange) 18%, black)"
          />
          <stop
            offset="100%"
            stopColor="color-mix(in srgb, var(--cossistant-orange) 28%, black)"
          />
        </linearGradient>

        <linearGradient
          id={packageSideGradientId}
          x1="10"
          y1="40"
          x2="110"
          y2="94"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0%"
            stopColor="color-mix(in srgb, var(--cossistant-orange) 18%, black)"
          />
          <stop
            offset="100%"
            stopColor="color-mix(in srgb, var(--cossistant-orange) 28%, black)"
          />
        </linearGradient>

        <radialGradient
          id={packageFloorGradientId}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(60 84) rotate(0) scale(46 17)"
        >
          <stop
            offset="0%"
            stopColor="color-mix(in srgb, var(--cossistant-orange) 40%, black)"
          />
          <stop
            offset="100%"
            stopColor="color-mix(in srgb, var(--cossistant-orange) 28%, black)"
          />
        </radialGradient>

        <linearGradient
          id={packageFrontGradientId}
          x1="60"
          y1="86"
          x2="60"
          y2="110"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0%"
            stopColor="color-mix(in srgb, var(--cossistant-orange) 28%, black)"
          />
          <stop
            offset="100%"
            stopColor="color-mix(in srgb, var(--cossistant-orange) 40%, black)"
          />
        </linearGradient>

        <linearGradient
          id={packageEdgeGradientId}
          x1="12"
          y1="20"
          x2="108"
          y2="110"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0%"
            stopColor="color-mix(in srgb, var(--cossistant-orange) 62%, white)"
          />
          <stop
            offset="100%"
            stopColor="color-mix(in srgb, var(--cossistant-orange) 32%, black)"
          />
        </linearGradient>

        <filter
          id={packageShadowFilterId}
          x="-20%"
          y="-20%"
          width="140%"
          height="146%"
          colorInterpolationFilters="sRGB"
        >
          <feDropShadow
            dx="0"
            dy="0.7"
            stdDeviation="0.9"
            floodColor="color-mix(in srgb, var(--cossistant-orange) 28%, black)"
            floodOpacity="0.22"
          />
          <feDropShadow
            dx="0"
            dy="0"
            stdDeviation="2.0"
            floodColor="color-mix(in srgb, var(--cossistant-orange) 18%, black)"
            floodOpacity="0.1"
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
