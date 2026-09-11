import {
  GROVE_HEIGHT,
  GROVE_WIDTH,
  groveOrigin,
  type ForestCamera,
  type ForestSilhouette,
  type ForestTree,
  type ForestViewDensity,
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

/**
 * Pixel maps. Characters:
 * ` ` empty, `t` trunk, `d` dark canopy, `m` mid, `l` light.
 * Later these rows can be replaced by image sprites.
 */
const SPRITES: Record<TreeKind, string[][]> = {
  pine: [
    ['  l  ', ' lml ', 'lmmml', '  t  '],
    ['   l   ', '  lml  ', ' lmmml ', 'lmmmmml', '  mmm  ', '   t   ', '   t   '],
    ['    l    ', '   lml   ', '  lmmml  ', ' lmmmmml ', 'lmmmmmmml', '  mmmmm  ', '    t    ', '    t    '],
  ],
  cedar: [
    [' l ', 'lml', 'mmm', ' t '],
    ['  l  ', ' lml ', 'lmmml', ' mmm ', '  t  ', '  t  '],
    ['   l   ', '  lml  ', ' lmmml ', 'lmmmmml', ' mmmmm ', '   t   ', '   t   '],
  ],
  broadleaf: [
    [' mm ', 'mmmm', ' mm ', ' t  '],
    ['  mm  ', ' mmmm ', 'mmmmmm', ' mmmm ', '  tt  '],
    ['  mmm  ', ' mmmmm ', 'mmmmmmm', ' mmmmm ', '  mmm  ', '   tt  '],
  ],
};

export type TreeSprite =
  | { type: 'pixels'; frames: string[][] }
  | {
      type: 'image';
      image: CanvasImageSource;
      anchorX: number;
      anchorY: number;
      width: number;
      height: number;
    };

const treeSprites: Record<TreeKind, TreeSprite> = {
  pine: { type: 'pixels', frames: SPRITES.pine },
  broadleaf: { type: 'pixels', frames: SPRITES.broadleaf },
  cedar: { type: 'pixels', frames: SPRITES.cedar },
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
  density: ForestViewDensity;
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

function cellSize(scene: ForestScene): number {
  const padX = scene.density === 'page' ? 4 : 2;
  const padY = 1;
  const fit = Math.min(scene.viewW / (GROVE_WIDTH + padX), scene.viewH / (GROVE_HEIGHT + padY));
  return Math.max(3, Math.floor(fit * scene.camera.zoom));
}

function fillCell(
  ctx: CanvasRenderingContext2D,
  gx: number,
  gy: number,
  color: string,
  cell: number,
  camera: ForestCamera,
  viewW: number,
  viewH: number,
  parallax: { x: number; y: number },
) {
  const sx = Math.floor((gx - camera.x - parallax.x) * cell + viewW / 2);
  const sy = Math.floor((gy - camera.y - parallax.y) * cell + viewH / 2);
  if (sx + cell < 0 || sy + cell < 0 || sx > viewW || sy > viewH) return;
  ctx.fillStyle = color;
  ctx.fillRect(sx, sy, cell, cell);
}

function ink(palette: ForestPalette, ch: string): string | null {
  if (ch === 't') return palette.brand900;
  if (ch === 'd') return palette.brand900;
  if (ch === 'm') return palette.brand800;
  if (ch === 'l') return palette.brand700;
  return null;
}

function drawPixelSprite(
  ctx: CanvasRenderingContext2D,
  rows: string[],
  originX: number,
  originY: number,
  cell: number,
  scene: ForestScene,
  grow: number,
) {
  const height = rows.length;
  const width = rows[0]?.length ?? 0;
  const shown = Math.max(1, Math.ceil(height * grow));
  const firstRow = height - shown;
  const left = originX - Math.floor(width / 2);
  const top = originY - (height - 1);

  for (let row = firstRow; row < height; row += 1) {
    const line = rows[row] ?? '';
    for (let col = 0; col < line.length; col += 1) {
      const color = ink(scene.palette, line[col] ?? ' ');
      if (!color) continue;
      fillCell(
        ctx,
        left + col,
        top + row,
        color,
        cell,
        scene.camera,
        scene.viewW,
        scene.viewH,
        scene.parallax,
      );
    }
  }
}

function drawTree(ctx: CanvasRenderingContext2D, tree: ForestTree, scene: ForestScene, cell: number) {
  const grow = scene.growingIndex === tree.index ? Math.max(0.15, scene.growProgress) : 1;
  if (grow <= 0.01) return;

  const sprite = treeSprites[tree.kind];
  if (sprite.type === 'image') {
    const sx = Math.floor((tree.x - scene.camera.x - scene.parallax.x) * cell + scene.viewW / 2);
    const sy = Math.floor((tree.y - scene.camera.y - scene.parallax.y) * cell + scene.viewH / 2);
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = grow;
    ctx.drawImage(
      sprite.image,
      sx - sprite.anchorX,
      sy - sprite.anchorY,
      sprite.width,
      sprite.height,
    );
    ctx.globalAlpha = 1;
    return;
  }

  const frames = sprite.frames;
  const frame = frames[Math.max(0, Math.min(frames.length - 1, Math.round(tree.size)))] ?? frames[0]!;
  ctx.globalAlpha = Math.min(1, grow * 1.2);
  drawPixelSprite(ctx, frame, tree.x, tree.y, cell, scene, grow);
  ctx.globalAlpha = 1;
}

function drawGround(ctx: CanvasRenderingContext2D, scene: ForestScene, cell: number) {
  const origin = groveOrigin(scene.focus.zoneIndex, scene.focus.groveIndex);
  const soil = scene.palette.line;
  const count = scene.density === 'page' ? 28 : 18;

  for (let i = 0; i < count; i += 1) {
    const x = origin.x + 3 + ((i * 13) % (GROVE_WIDTH - 6));
    const y = origin.y + GROVE_HEIGHT - 3 - (i % 2);
    if ((i * 5) % 3 === 0) continue;
    fillCell(ctx, x, y, soil, cell, scene.camera, scene.viewW, scene.viewH, scene.parallax);
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, scene: ForestScene, cell: number) {
  if (scene.particles.length === 0) return;
  for (const particle of scene.particles) {
    const t = (scene.now - particle.born) / particle.life;
    if (t <= 0 || t >= 1) continue;
    ctx.globalAlpha = (1 - t) * 0.7;
    fillCell(
      ctx,
      Math.round(particle.x),
      Math.round(particle.y),
      particle.spark ? scene.palette.brand400 : scene.palette.brand700,
      cell,
      scene.camera,
      scene.viewW,
      scene.viewH,
      scene.parallax,
    );
    ctx.globalAlpha = 1;
  }
}

export function renderForest(ctx: CanvasRenderingContext2D, scene: ForestScene, dpr: number): void {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, scene.viewW, scene.viewH);

  const cell = cellSize(scene);
  drawGround(ctx, scene, cell);

  for (const tree of scene.trees) {
    drawTree(ctx, tree, scene, cell);
  }

  drawParticles(ctx, scene, cell);
}
