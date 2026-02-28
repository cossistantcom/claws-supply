"use client"

import { motion, steps, useReducedMotion } from "motion/react"
import type { ReactElement } from "react"

import { cn } from "@/lib/utils"

const PIXEL_COUNT = 9
const GRID_SIZE = 3
const DEFAULT_SIZE = 18
const DEFAULT_SPEED = 1.2
const STATIC_OPACITY = 0.55
const PIXEL_OPACITY_KEYFRAMES = [0.18, 0.35, 0.62, 0.95, 0.55, 0.22]
const PIXEL_DELAYS = [0, 0.08, 0.16, 0.12, 0.2, 0.28, 0.24, 0.32, 0.4]
const STEPPED_EASE = steps(6, "end")

export type PixelLoaderProps = {
  className?: string
  size?: number
  speed?: number
  ariaLabel?: string
}

export function PixelLoader({
  className,
  size = DEFAULT_SIZE,
  speed = DEFAULT_SPEED,
  ariaLabel = "Loading",
}: PixelLoaderProps): ReactElement {
  const prefersReducedMotion = useReducedMotion()
  const resolvedSize = Number.isFinite(size) ? Math.max(8, size) : DEFAULT_SIZE
  const resolvedSpeed =
    Number.isFinite(speed) && speed > 0 ? speed : DEFAULT_SPEED

  return (
    <div
      role="status"
      aria-label={ariaLabel}
      className={cn("grid shrink-0 select-none", className)}
      style={{
        width: resolvedSize,
        height: resolvedSize,
        gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
        gap: 1,
      }}
    >
      {Array.from({ length: PIXEL_COUNT }).map((_, index) => (
        <motion.span
          key={index}
          aria-hidden="true"
          className="block bg-foreground"
          initial={false}
          animate={
            prefersReducedMotion
              ? { opacity: STATIC_OPACITY }
              : { opacity: PIXEL_OPACITY_KEYFRAMES }
          }
          transition={
            prefersReducedMotion
              ? undefined
              : {
                  duration: resolvedSpeed,
                  repeat: Infinity,
                  repeatType: "loop",
                  ease: STEPPED_EASE,
                  delay: PIXEL_DELAYS[index],
                }
          }
        />
      ))}
    </div>
  )
}
