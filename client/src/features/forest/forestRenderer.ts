import {
  GROVE_HEIGHT,
  GROVE_WIDTH,
  groveOrigin,
  type ForestCamera,
  type ForestSilhouette,
  type ForestTree,
  type TreeKind,
} from '@/features/forest/forestProgress';
import type { ForestParticle } from '@/features/forest/forestAnimations';

export type ForestPalette = {
  surface: string;
  panel: string;
  line: string;
  ink: string;
  muted: string;
  brand50: string;
  brand200: string;
  brand400: string;
  brand500: string;
  brand700: string;
  brand800: string;
  brand900: string;
};

export type SpriteDrawContext = {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  scale: number;
  alpha: number;
  palette: ForestPalette;
};

/**
 * Sprite registry so procedural trees can later be swapped for image assets.
 * Image sprites should use the trunk base as the anchor (x, y).
 */
export type TreeSprite =
  | {
      type: 'procedural';
      draw: (context: SpriteDrawContext) => void;
    }
  | {
      type: 'image';
      image: CanvasImageSource;
      anchorX: number;
      anchorY: number;
      width: number;
      height: number;
    };

const treeSprites: Record<TreeKind, TreeSprite> = {
  pine: { type: 'procedural', draw: drawPine },
  broadleaf: { type: 'procedural', draw: drawBroadleaf },
  cedar: { type: 'procedural', draw: drawCedar },
};

export function registerTreeSprite(kind: TreeKind, sprite: TreeSprite): void {
  treeSprites[kind] = sprite;
}

export type ForestScene = {
  trees: ForestTree[];
  silhouettes: ForestSilhouette[];
  growingIndex: number | null;
  growProgress: number;
  camera: ForestCamera;
  parallax: { x: number; y: number };
  particles: ForestParticle[];
  palette: ForestPalette;
  reducedEffects: boolean;
  density: 'preview' | 'page';
  viewW: number;
  viewH: number;
  now: number;
  focus: { zoneIndex: number; groveIndex: number };
};

const FALLBACK_PALETTE: ForestPalette = {
  surface: '#07110d',
  panel: '#101c17',
  line: '#2a3f35',
  ink: '#f2faf5',
  muted: '#a8c4b4',
  brand50: '#12241c',
  brand200: '#2a4f3c',
  brand400: '#5fc98e',
  brand500: '#8eefb4',
  brand700: '#4bb87a',
  brand800: '#348a5a',
  brand900: '#256344',
};

export function readForestPalette(element: HTMLElement | null): ForestPalette {
  if (!element) return FALLBACK_PALETTE;
  const styles = getComputedStyle(element);
  const read = (name: string, fallback: string) => {
    const value = styles.getPropertyValue(name).trim();
    return value || fallback;
  };

  return {
    surface: read('--app-surface', FALLBACK_PALETTE.surface),
    panel: read('--app-panel', FALLBACK_PALETTE.panel),
    line: read('--app-line', FALLBACK_PALETTE.line),
    ink: read('--app-ink', FALLBACK_PALETTE.ink),
    muted: read('--app-muted', FALLBACK_PALETTE.muted),
    brand50: read('--app-brand-50', FALLBACK_PALETTE.brand50),
    brand200: read('--app-brand-200', FALLBACK_PALETTE.brand200),
    brand400: read('--app-brand-400', FALLBACK_PALETTE.brand400),
    brand500: read('--app-brand-500', FALLBACK_PALETTE.brand500),
    brand700: read('--app-brand-700', FALLBACK_PALETTE.brand700),
    brand800: read('--app-brand-800', FALLBACK_PALETTE.brand800),
    brand900: read('--app-brand-900', FALLBACK_PALETTE.brand900),
  };
}

export function sizeForestCanvas(
  canvas: HTMLCanvasElement,
  isMobile: boolean,
): { cssW: number; cssH: number; dpr: number } {
  const rect = canvas.getBoundingClientRect();
  const cap = isMobile ? 1.5 : 2;
  const dpr = Math.min(window.devicePixelRatio || 1, cap);
  const width = Math.max(1, Math.round(rect.width * dpr));
  const height = Math.max(1, Math.round(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  return { cssW: Math.max(1, rect.width), cssH: Math.max(1, rect.height), dpr };
}

function applyCamera(ctx: CanvasRenderingContext2D, scene: ForestScene, dpr: number) {
  const { camera, parallax, viewW, viewH } = scene;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.translate(viewW / 2, viewH / 2);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x + parallax.x, -camera.y + parallax.y);
}

function drawTreeSprite(kind: TreeKind, context: SpriteDrawContext) {
  const sprite = treeSprites[kind];
  if (sprite.type === 'image') {
    const { ctx, x, y, scale, alpha } = context;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.drawImage(
      sprite.image,
      x - sprite.anchorX * scale,
      y - sprite.anchorY * scale,
      sprite.width * scale,
      sprite.height * scale,
    );
    ctx.restore();
    return;
  }
  sprite.draw(context);
}

function drawPine(context: SpriteDrawContext) {
  const { ctx, x, y, scale, palette } = context;
  const s = 26 * scale;
  ctx.fillStyle = 'rgba(12, 22, 18, 0.28)';
  ctx.beginPath();
  ctx.ellipse(x, y + 2, s * 0.28, s * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = mix(palette.brand900, '#1a140e', 0.35);
  ctx.fillRect(x - s * 0.05, y - s * 0.22, s * 0.1, s * 0.24);

  const layers = [
    { top: 0.92, w: 0.22, h: 0.28, color: mix(palette.brand800, palette.brand900, 0.25) },
    { top: 0.72, w: 0.3, h: 0.3, color: palette.brand800 },
    { top: 0.5, w: 0.36, h: 0.32, color: mix(palette.brand700, palette.brand800, 0.2) },
    { top: 0.28, w: 0.26, h: 0.28, color: mix(palette.brand700, palette.brand500, 0.15) },
  ];

  for (const layer of layers) {
    ctx.fillStyle = layer.color;
    ctx.beginPath();
    ctx.moveTo(x, y - s * layer.top);
    ctx.lineTo(x + s * layer.w, y - s * (layer.top - layer.h));
    ctx.lineTo(x - s * layer.w, y - s * (layer.top - layer.h));
    ctx.closePath();
    ctx.fill();
  }

  ctx.strokeStyle = `${palette.brand500}33`;
  ctx.lineWidth = Math.max(0.6, scale * 0.7);
  ctx.beginPath();
  ctx.moveTo(x - s * 0.08, y - s * 0.55);
  ctx.lineTo(x + s * 0.1, y - s * 0.7);
  ctx.stroke();
}

function drawBroadleaf(context: SpriteDrawContext) {
  const { ctx, x, y, scale, palette } = context;
  const s = 24 * scale;
  ctx.fillStyle = 'rgba(12, 22, 18, 0.26)';
  ctx.beginPath();
  ctx.ellipse(x, y + 2, s * 0.32, s * 0.09, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = mix(palette.brand900, '#24180f', 0.4);
  ctx.fillRect(x - s * 0.045, y - s * 0.2, s * 0.09, s * 0.22);

  ctx.fillStyle = mix(palette.brand800, palette.brand900, 0.15);
  ctx.beginPath();
  ctx.ellipse(x - s * 0.08, y - s * 0.42, s * 0.28, s * 0.24, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = palette.brand800;
  ctx.beginPath();
  ctx.ellipse(x + s * 0.1, y - s * 0.46, s * 0.26, s * 0.22, 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = mix(palette.brand700, palette.brand800, 0.25);
  ctx.beginPath();
  ctx.ellipse(x, y - s * 0.58, s * 0.22, s * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `${palette.brand500}22`;
  ctx.beginPath();
  ctx.ellipse(x + s * 0.08, y - s * 0.62, s * 0.1, s * 0.08, 0.2, 0, Math.PI * 2);
  ctx.fill();
}

function drawCedar(context: SpriteDrawContext) {
  const { ctx, x, y, scale, palette } = context;
  const s = 28 * scale;
  ctx.fillStyle = 'rgba(12, 22, 18, 0.26)';
  ctx.beginPath();
  ctx.ellipse(x, y + 2, s * 0.24, s * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = mix(palette.brand900, '#1c1610', 0.3);
  ctx.fillRect(x - s * 0.04, y - s * 0.2, s * 0.08, s * 0.22);

  const bands = [0.86, 0.66, 0.46, 0.28];
  bands.forEach((top, index) => {
    const width = 0.16 + index * 0.05;
    ctx.fillStyle = index % 2 === 0 ? palette.brand800 : mix(palette.brand700, palette.brand800, 0.3);
    ctx.beginPath();
    ctx.moveTo(x, y - s * top);
    ctx.quadraticCurveTo(x + s * width, y - s * (top - 0.18), x, y - s * (top - 0.2));
    ctx.quadraticCurveTo(x - s * width, y - s * (top - 0.18), x, y - s * top);
    ctx.fill();
  });
}

function mix(a: string, b: string, t: number): string {
  const pa = parseColor(a);
  const pb = parseColor(b);
  if (!pa || !pb) return a;
  const r = Math.round(pa.r + (pb.r - pa.r) * t);
  const g = Math.round(pa.g + (pb.g - pa.g) * t);
  const bch = Math.round(pa.b + (pb.b - pa.b) * t);
  return `rgb(${r}, ${g}, ${bch})`;
}

function parseColor(input: string): { r: number; g: number; b: number } | null {
  const hex = input.trim();
  if (hex.startsWith('#') && (hex.length === 7 || hex.length === 4)) {
    const full =
      hex.length === 4
        ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
        : hex;
    const n = Number.parseInt(full.slice(1), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  const rgb = hex.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgb) {
    return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) };
  }
  return null;
}

function drawBackdrop(ctx: CanvasRenderingContext2D, scene: ForestScene) {
  const { viewW, viewH, palette } = scene;
  const sky = ctx.createLinearGradient(0, 0, 0, viewH);
  sky.addColorStop(0, mix(palette.surface, palette.brand700, 0.12));
  sky.addColorStop(0.45, palette.surface);
  sky.addColorStop(1, mix(palette.panel, palette.brand900, 0.35));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, viewW, viewH);

  const glow = ctx.createRadialGradient(viewW * 0.28, viewH * 0.18, 8, viewW * 0.28, viewH * 0.18, viewW * 0.55);
  glow.addColorStop(0, `${palette.brand500}18`);
  glow.addColorStop(1, `${palette.brand500}00`);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, viewW, viewH);

  if (!scene.reducedEffects) {
    ctx.fillStyle = `${palette.brand500}22`;
    const dots = scene.density === 'page' ? 8 : 5;
    for (let i = 0; i < dots; i += 1) {
      const px = ((i * 97 + 13) % 100) / 100 * viewW;
      const py = ((i * 53 + 21) % 40) / 100 * viewH;
      ctx.beginPath();
      ctx.arc(px, py, i % 2 === 0 ? 1.1 : 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawClearing(ctx: CanvasRenderingContext2D, scene: ForestScene) {
  const groves = new Map<string, { zoneIndex: number; groveIndex: number }>();
  groves.set(`${scene.focus.zoneIndex}:${scene.focus.groveIndex}`, scene.focus);
  for (const tree of scene.trees) {
    groves.set(`${tree.zoneIndex}:${tree.groveIndex}`, {
      zoneIndex: tree.zoneIndex,
      groveIndex: tree.groveIndex,
    });
  }

  for (const grove of groves.values()) {
    const origin = groveOrigin(grove.zoneIndex, grove.groveIndex);
    const cx = origin.x + GROVE_WIDTH / 2;
    const cy = origin.y + GROVE_HEIGHT * 0.68;
    const isFocus =
      grove.zoneIndex === scene.focus.zoneIndex && grove.groveIndex === scene.focus.groveIndex;

    ctx.fillStyle = mix(scene.palette.brand900, scene.palette.panel, isFocus ? 0.35 : 0.2);
    ctx.beginPath();
    ctx.ellipse(cx, cy, GROVE_WIDTH * 0.42, GROVE_HEIGHT * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();

    if (isFocus) {
      ctx.strokeStyle = `${scene.palette.brand500}18`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, GROVE_WIDTH * 0.36, GROVE_HEIGHT * 0.16, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

function drawSilhouettes(ctx: CanvasRenderingContext2D, scene: ForestScene) {
  for (const mass of scene.silhouettes) {
    const gradient = ctx.createRadialGradient(mass.x, mass.y, 8, mass.x, mass.y, mass.width * 0.55);
    gradient.addColorStop(0, `${scene.palette.brand900}aa`);
    gradient.addColorStop(0.55, `${scene.palette.brand800}66`);
    gradient.addColorStop(1, `${scene.palette.brand900}00`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(mass.x, mass.y, mass.width * 0.5, mass.height * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `${scene.palette.brand900}99`;
    const count = scene.reducedEffects ? 4 : 7;
    for (let i = 0; i < count; i += 1) {
      const ox = mass.x + ((i * 37) % 80 - 40) * (mass.width / 140);
      const oy = mass.y + ((i * 19) % 24 - 12);
      ctx.beginPath();
      ctx.moveTo(ox, oy - 26);
      ctx.lineTo(ox + 11, oy);
      ctx.lineTo(ox - 11, oy);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawMist(ctx: CanvasRenderingContext2D, scene: ForestScene) {
  if (scene.reducedEffects) return;
  const origin = groveOrigin(scene.focus.zoneIndex, scene.focus.groveIndex);
  const bands = [
    { y: origin.y + GROVE_HEIGHT * 0.42, h: 18, alpha: 0.08 },
    { y: origin.y + GROVE_HEIGHT * 0.7, h: 22, alpha: 0.06 },
  ];
  for (const band of bands) {
    const gradient = ctx.createLinearGradient(origin.x, band.y, origin.x + GROVE_WIDTH, band.y);
    gradient.addColorStop(0, `rgba(180, 220, 200, 0)`);
    gradient.addColorStop(0.5, `rgba(180, 220, 200, ${band.alpha})`);
    gradient.addColorStop(1, `rgba(180, 220, 200, 0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(origin.x, band.y, GROVE_WIDTH, band.h);
  }
}

function drawRocks(ctx: CanvasRenderingContext2D, scene: ForestScene) {
  if (scene.reducedEffects) return;
  const origin = groveOrigin(scene.focus.zoneIndex, scene.focus.groveIndex);
  ctx.fillStyle = mix(scene.palette.line, scene.palette.brand900, 0.4);
  const rocks = [
    { x: 0.2, y: 0.78, w: 10, h: 5 },
    { x: 0.78, y: 0.82, w: 8, h: 4 },
  ];
  for (const rock of rocks) {
    ctx.beginPath();
    ctx.ellipse(origin.x + rock.x * GROVE_WIDTH, origin.y + rock.y * GROVE_HEIGHT, rock.w, rock.h, 0.1, 0, Math.PI * 2);
    ctx.fill();
  }
}

function treeAppearance(tree: ForestTree, scene: ForestScene): { scale: number; alpha: number; y: number } {
  if (scene.growingIndex !== tree.index) {
    return { scale: tree.size, alpha: 1, y: tree.y };
  }
  const t = scene.growProgress;
  const grow = 1 - (1 - t) ** 3;
  return {
    scale: tree.size * grow,
    alpha: Math.min(1, t * 1.35),
    y: tree.y + (1 - grow) * 10,
  };
}

function drawParticles(ctx: CanvasRenderingContext2D, scene: ForestScene) {
  if (scene.particles.length === 0) return;
  ctx.fillStyle = scene.palette.brand500;
  for (const particle of scene.particles) {
    const t = (scene.now - particle.born) / particle.life;
    if (t <= 0 || t >= 1) continue;
    ctx.globalAlpha = (1 - t) * 0.55;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function rgba(color: string, alpha: number): string {
  const parsed = parseColor(color);
  if (!parsed) return `rgba(0, 0, 0, ${alpha})`;
  return `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${alpha})`;
}

function drawVignette(ctx: CanvasRenderingContext2D, scene: ForestScene) {
  const { viewW, viewH, palette } = scene;
  const vignette = ctx.createRadialGradient(
    viewW / 2,
    viewH / 2,
    Math.min(viewW, viewH) * 0.25,
    viewW / 2,
    viewH / 2,
    Math.max(viewW, viewH) * 0.72,
  );
  vignette.addColorStop(0, rgba(palette.surface, 0));
  vignette.addColorStop(1, rgba(palette.surface, 0.42));
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, viewW, viewH);
}

export function renderForest(ctx: CanvasRenderingContext2D, scene: ForestScene, dpr: number): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  drawBackdrop(ctx, scene);

  ctx.save();
  applyCamera(ctx, scene, dpr);
  drawSilhouettes(ctx, scene);
  drawClearing(ctx, scene);
  drawRocks(ctx, scene);
  drawMist(ctx, scene);

  for (const tree of scene.trees) {
    const look = treeAppearance(tree, scene);
    if (look.alpha <= 0.01 || look.scale <= 0.01) continue;
    ctx.save();
    ctx.globalAlpha = look.alpha;
    drawTreeSprite(tree.kind, {
      ctx,
      x: tree.x,
      y: look.y,
      scale: look.scale,
      alpha: 1,
      palette: scene.palette,
    });
    ctx.restore();
  }

  drawParticles(ctx, scene);
  ctx.restore();

  drawVignette(ctx, scene);
}
