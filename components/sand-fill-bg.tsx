"use client";

import { createContext, useContext, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

type SandFillVariant = "default" | "hourglass";

interface SandFillBgProps {
  children: React.ReactNode;
  className?: string;
  backgroundLayer?: React.ReactNode;
  variant?: SandFillVariant;
  /** Run the simulation even when offscreen (pre-fill before user scrolls in). */
  eager?: boolean;
}

interface SandFillProfile {
  grain: number;
  spawnRate: number;
  gravity: number;
  fillRatio: number;
  sandAlpha: number;
  particleAlpha: number;
  fadeSpeed: number;
  pauseFrames: number;
  spawnSpread: number;
  drift: number;
  rollThreshold: number;
}

// ── Simulation context ──

export interface SandSimulationState {
  heightmap: number[];
  particles: { x: number; y: number; vy: number; vx: number }[];
  cols: number;
  rows: number;
  grain: number;
  w: number;
  h: number;
  phase: "fill" | "pause" | "fade";
  fadeOpacity: number;
}

interface SandSimulationContextValue {
  simulationRef: React.RefObject<SandSimulationState>;
  subscribe: (cb: () => void) => () => void;
}

const SandSimulationContext = createContext<SandSimulationContextValue | null>(
  null
);

export function useSandSimulation() {
  const ctx = useContext(SandSimulationContext);
  if (!ctx)
    throw new Error("useSandSimulation must be used inside <SandFillBg>");
  return ctx;
}

// ── Profiles ──

const PROFILE_BY_VARIANT: Record<SandFillVariant, SandFillProfile> = {
  default: {
    grain: 3,
    spawnRate: 3,
    gravity: 0.12,
    fillRatio: 0.15,
    sandAlpha: 0.06,
    particleAlpha: 0.1,
    fadeSpeed: 0.008,
    pauseFrames: 90,
    spawnSpread: 0.55,
    drift: 1.8,
    rollThreshold: 0,
  },
  hourglass: {
    grain: 3,
    spawnRate: 3,
    gravity: 0.12,
    fillRatio: 0.14,
    sandAlpha: 0.08,
    particleAlpha: 0.14,
    fadeSpeed: 0.008,
    pauseFrames: 110,
    spawnSpread: 0.45,
    drift: 2.0,
    rollThreshold: 0,
  },
};

// ── Component ──

export function SandFillBg({
  children,
  className,
  backgroundLayer,
  variant = "default",
  eager = false,
}: SandFillBgProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const subscribersRef = useRef<Set<() => void>>(new Set());
  const simulationRef = useRef<SandSimulationState>({
    heightmap: [],
    particles: [],
    cols: 0,
    rows: 0,
    grain: 3,
    w: 0,
    h: 0,
    phase: "fill",
    fadeOpacity: 1,
  });

  const subscribe = useCallback((cb: () => void) => {
    subscribersRef.current.add(cb);
    return () => {
      subscribersRef.current.delete(cb);
    };
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const profile = PROFILE_BY_VARIANT[variant];
    if (!canvasRef.current || !wrapRef.current) return;
    const canvas: HTMLCanvasElement = canvasRef.current;
    const wrap: HTMLElement = wrapRef.current;

    const maybeCtx = canvas.getContext("2d", { alpha: true });
    if (!maybeCtx) return;
    const ctx: CanvasRenderingContext2D = maybeCtx;

    const fgColor = getComputedStyle(wrap).color;

    let raf = 0;
    let w = 0;
    let h = 0;
    let cols = 0;
    let rows = 0;
    let settled = 0;
    let maxSettled = 0;
    let heightmap: number[] = [];
    let particles: { x: number; y: number; vy: number; vx: number }[] = [];
    let phase: "fill" | "pause" | "fade" = "fill";
    let fadeOpacity = 1;
    let pauseCounter = 0;
    let visible = true;

    function init() {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      cols = Math.ceil(w / profile.grain);
      rows = Math.ceil(h / profile.grain);
      heightmap = new Array(cols).fill(0);
      particles = [];
      settled = 0;
      maxSettled = Math.floor(cols * rows * profile.fillRatio);
      phase = "fill";
      fadeOpacity = 1;
      pauseCounter = 0;
    }

    function deposit(col: number) {
      const clamped = Math.max(0, Math.min(cols - 1, col));
      const currentHeight = heightmap[clamped];
      const leftHeight = clamped > 0 ? heightmap[clamped - 1] : currentHeight;
      const rightHeight =
        clamped < cols - 1 ? heightmap[clamped + 1] : currentHeight;

      const canRollLeft =
        clamped > 0 && currentHeight - leftHeight > profile.rollThreshold;
      const canRollRight =
        clamped < cols - 1 &&
        currentHeight - rightHeight > profile.rollThreshold;

      let targetCol = clamped;

      if (canRollLeft && canRollRight) {
        targetCol += Math.random() < 0.5 ? -1 : 1;
      } else if (canRollLeft) {
        targetCol -= 1;
      } else if (canRollRight) {
        targetCol += 1;
      }

      heightmap[targetCol]++;
      settled++;
    }

    function notifySubscribers() {
      const sim = simulationRef.current;
      sim.heightmap = heightmap;
      sim.particles = particles;
      sim.cols = cols;
      sim.rows = rows;
      sim.grain = profile.grain;
      sim.w = w;
      sim.h = h;
      sim.phase = phase;
      sim.fadeOpacity = fadeOpacity;

      for (const cb of subscribersRef.current) cb();
    }

    function simulateStep() {
      if (phase === "fill" && settled >= maxSettled) {
        phase = "pause";
        pauseCounter = profile.pauseFrames;
      }

      if (phase === "pause") {
        pauseCounter--;
        if (pauseCounter <= 0) phase = "fade";
      }

      if (phase === "fade") {
        fadeOpacity -= profile.fadeSpeed;
        if (fadeOpacity <= 0) {
          heightmap.fill(0);
          particles = [];
          settled = 0;
          phase = "fill";
          fadeOpacity = 1;
          return;
        }
      }

      if (phase === "fill") {
        const cx = w / 2;
        const spread = w * profile.spawnSpread;
        for (let i = 0; i < profile.spawnRate; i++) {
          particles.push({
            x: cx + (Math.random() - 0.5) * spread,
            y: -profile.grain,
            vy: 0.4 + Math.random() * 0.4,
            vx: (Math.random() - 0.5) * profile.drift,
          });
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vy += profile.gravity;
        p.y += p.vy;
        p.x += p.vx;

        const col = Math.floor(p.x / profile.grain);

        if (col < 0 || col >= cols) {
          particles.splice(i, 1);
          continue;
        }

        const pileTop = rows - heightmap[col];
        const row = Math.floor(p.y / profile.grain);

        if (row >= pileTop - 1) {
          if (phase === "fill") deposit(col);
          particles.splice(i, 1);
        }
      }
    }

    function frame() {
      if (!visible) {
        raf = requestAnimationFrame(frame);
        return;
      }

      ctx.clearRect(0, 0, w, h);

      simulateStep();

      ctx.fillStyle = fgColor;
      ctx.globalAlpha = profile.sandAlpha * fadeOpacity;

      for (let c = 0; c < cols; c++) {
        const pileHeight = heightmap[c];
        if (pileHeight <= 0) continue;

        ctx.fillRect(
          c * profile.grain,
          h - pileHeight * profile.grain,
          profile.grain,
          pileHeight * profile.grain
        );
      }

      if (phase !== "fade" || fadeOpacity > 0.5) {
        ctx.globalAlpha = profile.particleAlpha * fadeOpacity;
        for (const p of particles) {
          ctx.fillRect(
            Math.floor(p.x / profile.grain) * profile.grain,
            Math.floor(p.y / profile.grain) * profile.grain,
            profile.grain,
            profile.grain
          );
        }
      }

      ctx.globalAlpha = 1;

      notifySubscribers();
      raf = requestAnimationFrame(frame);
    }

    init();

    // When eager, pre-simulate ~5s worth of frames synchronously so
    // the pile is already built when the user scrolls into view.
    if (eager && cols > 0) {
      const PRE_FRAMES = 300;
      for (let f = 0; f < PRE_FRAMES && phase === "fill"; f++) {
        simulateStep();
      }
    }

    raf = requestAnimationFrame(frame);

    const resizeObserver = new ResizeObserver(() => init());
    resizeObserver.observe(wrap);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0 }
    );
    intersectionObserver.observe(wrap);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [variant, eager]);

  const ctxValue: SandSimulationContextValue = {
    simulationRef,
    subscribe,
  };

  return (
    <SandSimulationContext.Provider value={ctxValue}>
      <div
        ref={wrapRef}
        className={cn("relative overflow-hidden isolate", className)}
      >
        {backgroundLayer ? (
          <div className="absolute inset-0 z-0 pointer-events-none">
            {backgroundLayer}
          </div>
        ) : null}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 z-[1] w-full h-full pointer-events-none"
          aria-hidden="true"
        />
        <div className="relative z-10">{children}</div>
      </div>
    </SandSimulationContext.Provider>
  );
}
