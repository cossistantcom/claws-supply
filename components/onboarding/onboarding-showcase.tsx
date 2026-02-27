"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { useTexture } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  CanvasTexture,
  DoubleSide,
  LinearFilter,
  MathUtils,
  Mesh,
  SRGBColorSpace,
  Texture,
} from "three";
import { AsciiEffect } from "three-stdlib";

/** Image per step — all hand-phone.png for now; swap later. */
const STEP_IMAGES: Record<number, string> = {
  1: "/hand-phone.png",
  2: "/hand-phone.png",
  3: "/hand-phone.png",
  4: "/hand-phone.png",
};

const ASCII_CHARS =
  " .'`^\",:;Il!i~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
const PLANE_HEIGHT = 5;
const FALLBACK_ASPECT = 0.74;
const LUMA_WINDOW = [145, 255] as const;
const KEY_ALPHA_HARD = 12;
const KEY_ALPHA_SOFT = 24;
const LUMA_INVERSION_MIX = 2;
const LUMA_CONTRAST = 4;

export function OnboardingShowcase({ currentStep }: { currentStep: number }) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const imageSrc = STEP_IMAGES[currentStep] ?? STEP_IMAGES[1];

  return (
    <div className="absolute inset-0 bg-black overflow-hidden">
      <Canvas
        className="absolute inset-0 h-full w-full pointer-events-none"
        style={{ opacity: 0.012 }}
        frameloop="always"
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
          <ImagePlane src={imageSrc} />
        </Suspense>
        <AsciiRenderer overlayRef={overlayRef} />
      </Canvas>
      <div
        ref={overlayRef}
        className="absolute inset-0 pointer-events-none overflow-hidden"
      />
    </div>
  );
}

function ImagePlane({ src }: { src: string }) {
  const meshRef = useRef<Mesh>(null);
  const texture = useTexture(src);
  const processed = useMemo(() => buildProcessedTexture(texture), [texture]);
  const aspect = useMemo(() => getTextureAspect(texture), [texture]);
  const planeSize = useMemo<[number, number]>(
    () => [PLANE_HEIGHT * aspect, PLANE_HEIGHT],
    [aspect],
  );

  useEffect(() => {
    if (processed === texture) return;
    return () => processed.dispose();
  }, [processed, texture]);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const time = state.clock.getElapsedTime();
    const targetY = Math.sin(time * 0.8) * 0.06;
    mesh.position.y = MathUtils.damp(mesh.position.y, targetY, 4, delta);
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={planeSize} />
      <meshBasicMaterial
        map={processed}
        transparent
        alphaTest={0.05}
        side={DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}

function AsciiRenderer({
  overlayRef,
}: {
  overlayRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { size, gl, scene, camera } = useThree();
  const frameAccumulator = useRef(0);

  const effect = useMemo(() => {
    const ascii = new AsciiEffect(gl, ASCII_CHARS, {
      invert: false,
      color: false,
      resolution: 0.2,
    });
    ascii.domElement.style.position = "absolute";
    ascii.domElement.style.top = "0";
    ascii.domElement.style.left = "0";
    ascii.domElement.style.pointerEvents = "none";
    ascii.domElement.style.color = "#fbfbfb";
    ascii.domElement.style.backgroundColor = "transparent";
    ascii.domElement.style.willChange = "contents";
    return ascii;
  }, [gl]);

  useEffect(() => {
    let raf = 0;
    const mount = () => {
      const overlay = overlayRef.current;
      if (!overlay) {
        raf = window.requestAnimationFrame(mount);
        return;
      }
      overlay.appendChild(effect.domElement);
    };
    mount();
    return () => {
      window.cancelAnimationFrame(raf);
      effect.domElement.remove();
    };
  }, [effect, overlayRef]);

  useEffect(() => {
    effect.setSize(size.width, size.height);
  }, [effect, size.height, size.width]);

  useFrame((_, delta) => {
    frameAccumulator.current += delta;
    const frameBudget = 1 / 24;
    if (frameAccumulator.current < frameBudget) return;
    frameAccumulator.current = 0;
    effect.render(scene, camera);
  }, 1);

  return null;
}

function buildProcessedTexture(texture: Texture) {
  const image = texture.image as
    | HTMLImageElement
    | HTMLCanvasElement
    | ImageBitmap
    | undefined;

  if (!image || typeof document === "undefined") return texture;

  const width = (
    "naturalWidth" in image ? image.naturalWidth : image.width
  ) as number;
  const height = (
    "naturalHeight" in image ? image.naturalHeight : image.height
  ) as number;

  if (!width || !height) return texture;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return texture;

  ctx.drawImage(image, 0, 0, width, height);
  const img = ctx.getImageData(0, 0, width, height);
  const pixels = img.data;

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
      LUMA_WINDOW[0] + (contrastedLuma / 255) * (LUMA_WINDOW[1] - LUMA_WINDOW[0]);
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
  if (!image) return FALLBACK_ASPECT;

  const width = ("naturalWidth" in image ? image.naturalWidth : image.width) as number;
  const height = ("naturalHeight" in image ? image.naturalHeight : image.height) as number;

  if (!width || !height) return FALLBACK_ASPECT;
  return width / height;
}
