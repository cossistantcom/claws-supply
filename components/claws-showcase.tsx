"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTexture } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { motion, useInView, useReducedMotion } from "motion/react";
import {
  CanvasTexture,
  DoubleSide,
  Group,
  LinearFilter,
  MathUtils,
  Mesh,
  SRGBColorSpace,
  Texture,
} from "three";
import { AsciiEffect } from "three-stdlib";

const DARK_ASCII_CHARS =
  " .'`^\",:;Il!i~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
const LIGHT_ASCII_CHARS =
  " .'`^\",:;Il!i~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
const HAND_PLANE_HEIGHT = 4.15;
const FALLBACK_HAND_ASPECT = 0.74;
const LUMA_INVERSION_MIX = 2;
const LUMA_CONTRAST = 1;
const HANDS_DELAY_MS = 0;
const DARK_LUMA_WINDOW = [145, 255] as const;
const LIGHT_LUMA_WINDOW = [0, 120] as const;
const KEY_ALPHA_HARD = 12;
const KEY_ALPHA_SOFT = 24;
const ASCII_RESOLUTION = {
  desktop: { dark: 0.4, light: 0.4 },
  mobile: { dark: 0.15, light: 0.145 },
} as const;
const ASCII_FPS = {
  desktop: 30,
  mobile: 16,
  reducedMotion: 12,
} as const;

const CANVAS_VISIBLE_OPACITY = 0.2;
const CANVAS_HIDDEN_OPACITY = 0.012;
const ASCII_HEARTBEAT_STALE_MS = 420;
const ASCII_HEARTBEAT_INTERVAL_MS = 220;
const ASCII_USE_COLOR_SPANS = false;

export function AsciiClawsShowcase() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const asciiOverlayRef = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(containerRef, { amount: 0.2 });
  const prefersReducedMotion = useReducedMotion();
  const isDarkMode = useIsDarkMode();
  const isSmallViewport = useIsSmallViewport();

  const [phase, setPhase] = useState<"idle" | "phone" | "hands">("idle");

  useEffect(() => {
    const resetTimer = window.setTimeout(
      () => setPhase(isInView ? "phone" : "idle"),
      0,
    );

    if (!isInView) {
      return () => window.clearTimeout(resetTimer);
    }
    const timer = window.setTimeout(
      () => setPhase("hands"),
      prefersReducedMotion ? 80 : HANDS_DELAY_MS,
    );

    return () => {
      window.clearTimeout(resetTimer);
      window.clearTimeout(timer);
    };
  }, [isInView, prefersReducedMotion]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-visible">
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={false}
        animate={{ opacity: phase === "idle" ? 0 : 1 }}
        transition={{ duration: prefersReducedMotion ? 0.25 : 0.45 }}
      >
        <div className="absolute inset-0">
          <HandsAsciiCanvas
            active={phase === "hands"}
            isDarkMode={isDarkMode}
            isSmallViewport={isSmallViewport}
            prefersReducedMotion={prefersReducedMotion}
            overlayRef={asciiOverlayRef}
          />
          <div
            ref={asciiOverlayRef}
            className="absolute inset-0 pointer-events-none overflow-hidden"
          />
        </div>
      </motion.div>
    </div>
  );
}

function useIsDarkMode() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    const update = () => setIsDark(root.classList.contains("dark"));

    update();

    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  return isDark;
}

function useIsSmallViewport() {
  const [isSmall, setIsSmall] = useState(false);

  useEffect(() => {
    const update = () => setIsSmall(window.innerWidth < 768);
    update();

    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);

  return isSmall;
}

export function HandsAsciiCanvas({
  active,
  isDarkMode,
  isSmallViewport,
  prefersReducedMotion,
  overlayRef,
}: {
  active: boolean;
  isDarkMode: boolean;
  isSmallViewport: boolean;
  prefersReducedMotion: boolean | null;
  overlayRef: React.RefObject<HTMLDivElement | null>;
}) {
  const resolution = isDarkMode
    ? isSmallViewport
      ? ASCII_RESOLUTION.mobile.dark
      : ASCII_RESOLUTION.desktop.dark
    : isSmallViewport
      ? ASCII_RESOLUTION.mobile.light
      : ASCII_RESOLUTION.desktop.light;
  const maxFps = prefersReducedMotion
    ? ASCII_FPS.reducedMotion
    : isSmallViewport
      ? ASCII_FPS.mobile
      : ASCII_FPS.desktop;
  const [showCanvasFallback, setShowCanvasFallback] = useState(true);
  const lastAsciiFrameTimeRef = useRef(0);
  const fallbackShownRef = useRef(true);

  const handleAsciiMounted = useCallback(() => {
    lastAsciiFrameTimeRef.current = performance.now();
    setShowCanvasFallback(false);
    fallbackShownRef.current = false;
  }, []);

  const handleAsciiFrame = useCallback(() => {
    lastAsciiFrameTimeRef.current = performance.now();
    if (!fallbackShownRef.current) {
      return;
    }

    fallbackShownRef.current = false;
    setShowCanvasFallback(false);
  }, []);

  useEffect(() => {
    const resetTimer = window.setTimeout(() => {
      if (!active) {
        setShowCanvasFallback(true);
        fallbackShownRef.current = true;
        return;
      }

      const now = performance.now();
      const age = now - lastAsciiFrameTimeRef.current;
      const shouldShowFallback = age > ASCII_HEARTBEAT_STALE_MS;
      setShowCanvasFallback(shouldShowFallback);
      fallbackShownRef.current = shouldShowFallback;
    }, 0);

    if (!active) {
      return () => window.clearTimeout(resetTimer);
    }

    const monitor = window.setInterval(() => {
      const now = performance.now();
      const age = now - lastAsciiFrameTimeRef.current;
      const shouldShowFallback = age > ASCII_HEARTBEAT_STALE_MS;
      fallbackShownRef.current = shouldShowFallback;
      setShowCanvasFallback((prev) =>
        prev === shouldShowFallback ? prev : shouldShowFallback,
      );
    }, ASCII_HEARTBEAT_INTERVAL_MS);

    return () => {
      window.clearTimeout(resetTimer);
      window.clearInterval(monitor);
    };
  }, [active]);

  return (
    <Canvas
      className="absolute inset-0 h-full w-full pointer-events-none"
      style={{
        opacity: showCanvasFallback
          ? CANVAS_VISIBLE_OPACITY
          : CANVAS_HIDDEN_OPACITY,
      }}
      frameloop={active ? "always" : "demand"}
      dpr={1}
      camera={{ position: [0, 0, 5.4], fov: 28 }}
      gl={{
        alpha: true,
        antialias: false,
        powerPreference: "high-performance",
      }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
      }}
    >
      <Suspense fallback={null}>
        <AsciiHand side={0.3} active={active} isDarkMode={isDarkMode} />
      </Suspense>

      <ThrottledAsciiRenderer
        enabled={active}
        fgColor={isDarkMode ? "#fbfbfb" : "#050505"}
        bgColor="transparent"
        characters={isDarkMode ? DARK_ASCII_CHARS : LIGHT_ASCII_CHARS}
        color={ASCII_USE_COLOR_SPANS}
        invert={false}
        resolution={resolution}
        maxFps={maxFps}
        overlayRef={overlayRef}
        onMounted={handleAsciiMounted}
        onFrame={handleAsciiFrame}
      />
    </Canvas>
  );
}

function ThrottledAsciiRenderer({
  enabled,
  fgColor = "white",
  bgColor = "transparent",
  characters = " .:-+*=%@#",
  invert = false,
  color = false,
  resolution = 0.15,
  maxFps = 42,
  overlayRef,
  onMounted,
  onFrame,
}: {
  enabled: boolean;
  fgColor?: string;
  bgColor?: string;
  characters?: string;
  invert?: boolean;
  color?: boolean;
  resolution?: number;
  maxFps?: number;
  overlayRef: React.RefObject<HTMLDivElement | null>;
  onMounted?: () => void;
  onFrame?: () => void;
}) {
  const { size, gl, scene, camera } = useThree();
  const frameAccumulator = useRef(0);

  const effect = useMemo(() => {
    const ascii = new AsciiEffect(gl, characters, {
      invert,
      color,
      resolution,
    });

    ascii.domElement.style.position = "absolute";
    ascii.domElement.style.top = "0";
    ascii.domElement.style.left = "0";
    ascii.domElement.style.pointerEvents = "none";
    ascii.domElement.style.color = fgColor;
    ascii.domElement.style.backgroundColor = bgColor;
    ascii.domElement.style.willChange = "contents";

    return ascii;
  }, [bgColor, characters, color, fgColor, gl, invert, resolution]);

  useEffect(() => {
    let raf = 0;

    const mount = () => {
      const overlay = overlayRef.current;
      if (!overlay) {
        raf = window.requestAnimationFrame(mount);
        return;
      }

      overlay.appendChild(effect.domElement);
      onMounted?.();
    };

    mount();

    return () => {
      window.cancelAnimationFrame(raf);
      effect.domElement.remove();
    };
  }, [effect, onMounted, overlayRef]);

  useEffect(() => {
    effect.setSize(size.width, size.height);
  }, [effect, size.height, size.width]);

  useFrame((_, delta) => {
    if (!enabled) {
      return;
    }

    frameAccumulator.current += delta;
    const frameBudget = 1 / Math.max(12, maxFps);

    if (frameAccumulator.current < frameBudget) {
      return;
    }

    frameAccumulator.current = 0;
    effect.render(scene, camera);
    onFrame?.();
  }, 1);

  return null;
}

function AsciiHand({
  side,
  active,
  mirrored = false,
  isDarkMode,
}: {
  side: -1 | 1.2;
  active: boolean;
  mirrored?: boolean;
  isDarkMode: boolean;
}) {
  const groupRef = useRef<Group>(null);
  const meshRef = useRef<Mesh>(null);
  const texture = useTexture("/claw-bot.png");
  const keyedTexture = useMemo(
    () => buildKeyedHandTexture(texture, isDarkMode),
    [isDarkMode, texture],
  );
  const handAspect = useMemo(() => getTextureAspect(texture), [texture]);
  const planeSize = useMemo<[number, number]>(
    () => [HAND_PLANE_HEIGHT * handAspect, HAND_PLANE_HEIGHT],
    [handAspect],
  );

  useEffect(() => {
    if (keyedTexture === texture) {
      return;
    }

    return () => keyedTexture.dispose();
  }, [keyedTexture, texture]);

  useFrame((state, delta) => {
    const group = groupRef.current;
    const mesh = meshRef.current;

    if (!group || !mesh) {
      return;
    }

    const time = state.clock.getElapsedTime();
    const pointerX = state.pointer.x;
    const pointerY = state.pointer.y;

    const targetX = active ? side * 1.94 + pointerX * 0.028 : side * 2.42;
    const targetY = active ? -0.42 + Math.sin(time * 1.3 + side) * 0.05 : -3.95;
    const targetZ = active ? -0.18 + Math.cos(time * 1.15 + side) * 0.05 : 0.08;

    const targetRotX = active ? 0.04 + pointerY * 0.015 : 0.28;
    const targetRotY = active ? side * 0.17 + pointerX * 0.024 : side * 0.28;
    const targetRotZ = active
      ? side * -0.06 + Math.sin(time * 1.05 + side) * 0.015
      : side * -0.04;

    group.position.x = MathUtils.damp(group.position.x, targetX, 5.5, delta);
    group.position.y = MathUtils.damp(group.position.y, targetY, 4.8, delta);
    group.position.z = MathUtils.damp(group.position.z, targetZ, 5.2, delta);

    group.rotation.x = MathUtils.damp(group.rotation.x, targetRotX, 5.2, delta);
    group.rotation.y = MathUtils.damp(group.rotation.y, targetRotY, 4.8, delta);
    group.rotation.z = MathUtils.damp(group.rotation.z, targetRotZ, 5.2, delta);

    const baseScale = active ? 1 + Math.sin(time * 1.2 + side) * 0.006 : 0.96;
    const xScale = mirrored ? -baseScale : baseScale;

    mesh.scale.x = MathUtils.damp(mesh.scale.x, xScale, 5.4, delta);
    mesh.scale.y = MathUtils.damp(mesh.scale.y, baseScale, 5.4, delta);
  });

  return (
    <group
      ref={groupRef}
      position={[side * 2.42, -3.95, 0.08]}
      rotation={[0.28, side * 0.28, side * -0.04]}
    >
      <mesh ref={meshRef} scale={[mirrored ? -1.04 : 1.04, 1.04, 1]}>
        <planeGeometry args={planeSize} />
        <meshBasicMaterial
          map={keyedTexture}
          transparent
          alphaTest={0.05}
          side={DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function buildKeyedHandTexture(texture: Texture, isDarkMode: boolean) {
  const image = texture.image as
    | HTMLImageElement
    | HTMLCanvasElement
    | ImageBitmap
    | undefined;

  if (!image || typeof document === "undefined") {
    return texture;
  }

  const width = (
    "naturalWidth" in image
      ? image.naturalWidth
      : "videoWidth" in image
        ? image.videoWidth
        : image.width
  ) as number;
  const height = (
    "naturalHeight" in image
      ? image.naturalHeight
      : "videoHeight" in image
        ? image.videoHeight
        : image.height
  ) as number;

  if (!width || !height) {
    return texture;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return texture;
  }

  ctx.drawImage(image, 0, 0, width, height);
  const img = ctx.getImageData(0, 0, width, height);
  const pixels = img.data;
  const [lumaWindowMin, lumaWindowMax] = isDarkMode
    ? DARK_LUMA_WINDOW
    : LIGHT_LUMA_WINDOW;

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    if (luminance <= KEY_ALPHA_HARD) {
      pixels[i + 3] = 0;
      continue;
    }

    if (luminance < KEY_ALPHA_SOFT) {
      const blend =
        (luminance - KEY_ALPHA_HARD) / (KEY_ALPHA_SOFT - KEY_ALPHA_HARD);
      pixels[i + 3] = Math.round(pixels[i + 3] * blend);
    }

    const invertedLuma = 255 - luminance;
    const mixedLuma =
      luminance * (1 - LUMA_INVERSION_MIX) + invertedLuma * LUMA_INVERSION_MIX;
    const contrastedLuma = MathUtils.clamp(
      (mixedLuma - 128) * LUMA_CONTRAST + 128,
      0,
      255,
    );

    const remappedLuma =
      lumaWindowMin + (contrastedLuma / 255) * (lumaWindowMax - lumaWindowMin);
    const mono = Math.round(remappedLuma);
    pixels[i] = mono;
    pixels[i + 1] = mono;
    pixels[i + 2] = mono;
  }

  ctx.putImageData(img, 0, 0);

  const keyed = new CanvasTexture(canvas);
  keyed.colorSpace = SRGBColorSpace;
  keyed.minFilter = LinearFilter;
  keyed.magFilter = LinearFilter;
  keyed.generateMipmaps = false;
  keyed.needsUpdate = true;

  return keyed;
}

function getTextureAspect(texture: Texture) {
  const image = texture.image as
    | HTMLImageElement
    | HTMLCanvasElement
    | ImageBitmap
    | undefined;
  const size = getImageSize(image);

  if (!size) {
    return FALLBACK_HAND_ASPECT;
  }

  return size.width / size.height;
}

function getImageSize(
  image: HTMLImageElement | HTMLCanvasElement | ImageBitmap | undefined,
) {
  if (!image) {
    return null;
  }

  const width = "naturalWidth" in image ? image.naturalWidth : image.width;
  const height = "naturalHeight" in image ? image.naturalHeight : image.height;

  if (!width || !height) {
    return null;
  }

  return { width, height };
}
