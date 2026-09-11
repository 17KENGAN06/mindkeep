import type { ForestCamera, Vec2 } from '@/features/forest/forestProgress';

export const TREE_GROW_MS = 860;
export const GROVE_CAM_MS = 1320;
export const ZONE_CAM_MS = 1480;
export const PLUS_ONE_MS = 780;
export const BANNER_MS = 900;

export type ForestParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  born: number;
  life: number;
  size: number;
};

export function clamp01(value: number): number {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function easeOutCubic(t: number): number {
  const p = clamp01(t);
  return 1 - (1 - p) ** 3;
}

export function easeInOutCubic(t: number): number {
  const p = clamp01(t);
  return p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2;
}

export function lerpCamera(a: ForestCamera, b: ForestCamera, t: number): ForestCamera {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    zoom: lerp(a.zoom, b.zoom, t),
  };
}

/** Zoom out, pan, then settle — used for grove/zone transitions. */
export function cameraPath(
  from: ForestCamera,
  overview: ForestCamera,
  to: ForestCamera,
  t: number,
): ForestCamera {
  const p = clamp01(t);
  const zoom =
    p < 0.34
      ? lerp(from.zoom, overview.zoom, easeOutCubic(p / 0.34))
      : p < 0.62
        ? overview.zoom
        : lerp(overview.zoom, to.zoom, easeInOutCubic((p - 0.62) / 0.38));

  const panT = easeInOutCubic(clamp01((p - 0.18) / 0.54));
  return {
    x: lerp(from.x, to.x, panT),
    y: lerp(from.y, to.y, panT),
    zoom,
  };
}

export function startAnimationLoop(onFrame: (now: number) => boolean): () => void {
  let frameId = 0;
  let stopped = false;

  const tick = (now: number) => {
    if (stopped) return;
    const keepGoing = onFrame(now);
    if (keepGoing && !stopped) {
      frameId = window.requestAnimationFrame(tick);
    } else {
      frameId = 0;
    }
  };

  frameId = window.requestAnimationFrame(tick);

  return () => {
    stopped = true;
    if (frameId) {
      window.cancelAnimationFrame(frameId);
      frameId = 0;
    }
  };
}

function hash01(n: number): number {
  const x = Math.sin(n * 91.7 + 17.3) * 23347.841;
  return x - Math.floor(x);
}

export function spawnGrowParticles(origin: Vec2, treeIndex: number, now: number, count: number): ForestParticle[] {
  const particles: ForestParticle[] = [];
  for (let i = 0; i < count; i += 1) {
    const h = hash01(treeIndex * 13 + i * 7);
    const h2 = hash01(treeIndex * 29 + i * 3);
    particles.push({
      x: origin.x + (h - 0.5) * 2,
      y: origin.y - 1 - h2 * 2,
      vx: (h - 0.5) * 0.004,
      vy: -0.006 - h2 * 0.004,
      born: now,
      life: 520 + h * 280,
      size: 1,
    });
  }
  return particles;
}

export function advanceParticles(
  particles: ForestParticle[],
  now: number,
  dt: number,
): ForestParticle[] {
  if (particles.length === 0) return particles;
  const next: ForestParticle[] = [];
  for (const particle of particles) {
    const age = now - particle.born;
    if (age >= particle.life) continue;
    next.push({
      ...particle,
      x: particle.x + particle.vx * dt,
      y: particle.y + particle.vy * dt,
      vy: particle.vy - 0.000012 * dt,
    });
  }
  return next;
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function isMobileViewport(): boolean {
  return window.matchMedia('(max-width: 767px)').matches;
}
