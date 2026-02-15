"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useSandSimulation } from "@/components/sand-fill-bg";

interface AsciiHourglassBackgroundProps {
  className?: string;
  opacity?: number;
  settledChar?: string;
  particleChar?: string;
}

const CHAR_ASPECT = 0.55; // monospace char width / height

export function AsciiHourglassBackground({
  className,
  opacity = 0.24,
  settledChar = "#",
  particleChar = ".",
}: AsciiHourglassBackgroundProps) {
  const preRef = useRef<HTMLPreElement>(null);
  const blurRef = useRef<HTMLPreElement>(null);
  const { simulationRef, subscribe } = useSandSimulation();

  useEffect(() => {
    function render() {
      const pre = preRef.current;
      if (!pre) return;

      const sim = simulationRef.current;
      if (sim.cols === 0 || sim.rows === 0) return;

      // Map the pixel-grid simulation to a smaller ASCII grid.
      // Each ASCII cell spans multiple simulation columns/rows
      // to maintain proper aspect ratio.
      const preRect = pre.parentElement?.getBoundingClientRect();
      if (!preRect || preRect.width === 0 || preRect.height === 0) return;

      // Target ~8px font size, compute ASCII grid dimensions
      const fontSize = 8;
      const charW = fontSize * CHAR_ASPECT;
      const asciiCols = Math.max(1, Math.floor(preRect.width / charW));
      const asciiRows = Math.max(1, Math.floor(preRect.height / fontSize));

      // Scale factors: how many simulation cells per ASCII cell
      const scaleX = sim.cols / asciiCols;
      const scaleY = sim.rows / asciiRows;

      // Build a flat grid: 0 = empty, 1 = settled, 2 = particle
      const grid = new Uint8Array(asciiCols * asciiRows);

      // Mark settled sand from heightmap
      const { heightmap, cols: simCols, rows: simRows } = sim;
      for (let ac = 0; ac < asciiCols; ac++) {
        // Which simulation column range maps to this ASCII column
        const simColStart = Math.floor(ac * scaleX);
        const simColEnd = Math.min(simCols, Math.floor((ac + 1) * scaleX));

        // Find max pile height across the mapped sim columns
        let maxPile = 0;
        for (let sc = simColStart; sc < simColEnd; sc++) {
          if (heightmap[sc] > maxPile) maxPile = heightmap[sc];
        }

        if (maxPile <= 0) continue;

        // Convert pile height to ASCII rows (from bottom)
        const asciiPileRows = Math.ceil(maxPile / scaleY);
        for (let ar = asciiRows - asciiPileRows; ar < asciiRows; ar++) {
          if (ar >= 0) {
            grid[ar * asciiCols + ac] = 1;
          }
        }
      }

      // Mark falling particles
      if (sim.phase !== "fade" || sim.fadeOpacity > 0.5) {
        for (const p of sim.particles) {
          const ac = Math.floor(p.x / (sim.grain * scaleX));
          const ar = Math.floor(p.y / (sim.grain * scaleY));
          if (ac >= 0 && ac < asciiCols && ar >= 0 && ar < asciiRows) {
            const idx = ar * asciiCols + ac;
            if (grid[idx] === 0) grid[idx] = 2;
          }
        }
      }

      // Build the string
      let out = "";
      for (let r = 0; r < asciiRows; r++) {
        if (r > 0) out += "\n";
        const rowOffset = r * asciiCols;
        for (let c = 0; c < asciiCols; c++) {
          const v = grid[rowOffset + c];
          out += v === 1 ? settledChar : v === 2 ? particleChar : " ";
        }
      }

      pre.textContent = out;
      if (blurRef.current) blurRef.current.textContent = out;

      // Update font size to match grid
      pre.style.fontSize = `${fontSize}px`;
      if (blurRef.current) blurRef.current.style.fontSize = `${fontSize}px`;
    }

    const unsubscribe = subscribe(render);
    return unsubscribe;
  }, [simulationRef, subscribe, settledChar, particleChar]);

  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative h-full w-full overflow-hidden pointer-events-none",
        className
      )}
      style={{ opacity }}
    >
      <div className="absolute inset-0 grid place-items-center">
        <pre
          ref={preRef}
          className="text-foreground/45 font-mono leading-none whitespace-pre select-none tracking-[-0.015em]"
        />
        <pre
          ref={blurRef}
          className="absolute text-foreground/35 font-mono leading-none whitespace-pre select-none tracking-[-0.015em] blur-[1.5px] animate-ascii-hourglass-pulse"
        />
      </div>
    </div>
  );
}
