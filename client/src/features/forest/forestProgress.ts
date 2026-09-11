export const TREES_PER_GROVE = 25;
export const TREES_PER_ZONE = 100;
export const GROVES_PER_ZONE = TREES_PER_ZONE / TREES_PER_GROVE;

export const GROVE_WIDTH = 400;
export const GROVE_HEIGHT = 260;
export const ZONE_GAP = 140;

export type TreeKind = 'pine' | 'broadleaf' | 'cedar';

export type GroveSlot = {
  x: number;
  y: number;
  kind: TreeKind;
  size: number;
};

/**
 * 25 predefined local positions for a single grove (normalized 0–1).
 * Reused for every grove; world placement is derived from zone/grove origin.
 */
export const GROVE_SLOTS: GroveSlot[] = [
  { x: 0.22, y: 0.28, kind: 'pine', size: 0.82 },
  { x: 0.4, y: 0.24, kind: 'cedar', size: 0.88 },
  { x: 0.58, y: 0.3, kind: 'pine', size: 0.78 },
  { x: 0.74, y: 0.26, kind: 'broadleaf', size: 0.8 },
  { x: 0.12, y: 0.36, kind: 'cedar', size: 0.86 },
  { x: 0.3, y: 0.4, kind: 'broadleaf', size: 0.94 },
  { x: 0.48, y: 0.38, kind: 'pine', size: 0.9 },
  { x: 0.66, y: 0.42, kind: 'cedar', size: 0.92 },
  { x: 0.82, y: 0.4, kind: 'pine', size: 0.84 },
  { x: 0.18, y: 0.5, kind: 'pine', size: 0.96 },
  { x: 0.38, y: 0.52, kind: 'cedar', size: 1 },
  { x: 0.54, y: 0.48, kind: 'broadleaf', size: 0.98 },
  { x: 0.72, y: 0.54, kind: 'pine', size: 1.02 },
  { x: 0.08, y: 0.58, kind: 'broadleaf', size: 0.9 },
  { x: 0.26, y: 0.62, kind: 'pine', size: 1.06 },
  { x: 0.46, y: 0.64, kind: 'cedar', size: 1.08 },
  { x: 0.62, y: 0.6, kind: 'pine', size: 1.04 },
  { x: 0.8, y: 0.66, kind: 'broadleaf', size: 0.96 },
  { x: 0.16, y: 0.72, kind: 'cedar', size: 1 },
  { x: 0.34, y: 0.74, kind: 'broadleaf', size: 1.1 },
  { x: 0.52, y: 0.76, kind: 'pine', size: 1.14 },
  { x: 0.7, y: 0.78, kind: 'cedar', size: 1.08 },
  { x: 0.88, y: 0.7, kind: 'pine', size: 0.94 },
  { x: 0.42, y: 0.86, kind: 'cedar', size: 1.16 },
  { x: 0.6, y: 0.88, kind: 'pine', size: 1.12 },
];

export type ForestSnapshot = {
  totalTrees: number;
  zoneIndex: number;
  treesInZone: number;
  groveIndex: number;
  treesInGrove: number;
  groveSize: number;
  remainingToGrove: number;
  completedZones: number;
  completedGroves: number;
};

export type Vec2 = { x: number; y: number };

export type ForestCamera = {
  x: number;
  y: number;
  zoom: number;
};

export type ForestTree = {
  index: number;
  zoneIndex: number;
  groveIndex: number;
  slot: number;
  x: number;
  y: number;
  kind: TreeKind;
  size: number;
};

export type ForestSilhouette = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ForestViewDensity = 'preview' | 'page';

export type ForestView = {
  snapshot: ForestSnapshot;
  trees: ForestTree[];
  silhouettes: ForestSilhouette[];
  focus: { zoneIndex: number; groveIndex: number };
};

const PREVIEW_TREE_CAP = 50;
const PAGE_TREE_CAP = 50;

export function deriveForestProgress(totalCompleted: number): ForestSnapshot {
  const totalTrees = Math.max(0, Math.floor(totalCompleted));
  const zoneIndex = Math.floor(totalTrees / TREES_PER_ZONE);
  const treesInZone = totalTrees % TREES_PER_ZONE;
  const groveIndex = Math.floor(treesInZone / TREES_PER_GROVE);
  const treesInGrove = treesInZone % TREES_PER_GROVE;

  return {
    totalTrees,
    zoneIndex,
    treesInZone,
    groveIndex,
    treesInGrove,
    groveSize: TREES_PER_GROVE,
    remainingToGrove: treesInGrove === 0 ? TREES_PER_GROVE : TREES_PER_GROVE - treesInGrove,
    completedZones: zoneIndex,
    completedGroves: Math.floor(totalTrees / TREES_PER_GROVE),
  };
}

export function isGroveComplete(totalCompleted: number): boolean {
  return totalCompleted > 0 && totalCompleted % TREES_PER_GROVE === 0;
}

export function isZoneComplete(totalCompleted: number): boolean {
  return totalCompleted > 0 && totalCompleted % TREES_PER_ZONE === 0;
}

export function groveOrigin(zoneIndex: number, groveIndex: number): Vec2 {
  const col = groveIndex % 2;
  const row = Math.floor(groveIndex / 2);
  return {
    x: zoneIndex * (GROVE_WIDTH * 2 + ZONE_GAP) + col * GROVE_WIDTH,
    y: row * GROVE_HEIGHT,
  };
}

export function groveCenter(zoneIndex: number, groveIndex: number): Vec2 {
  const origin = groveOrigin(zoneIndex, groveIndex);
  return {
    x: origin.x + GROVE_WIDTH / 2,
    y: origin.y + GROVE_HEIGHT * 0.58,
  };
}

export function zoneCenter(zoneIndex: number): Vec2 {
  const a = groveCenter(zoneIndex, 0);
  const b = groveCenter(zoneIndex, GROVES_PER_ZONE - 1);
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

function hash01(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

export function getTreeByIndex(index: number): ForestTree {
  const zoneIndex = Math.floor(index / TREES_PER_ZONE);
  const inZone = index % TREES_PER_ZONE;
  const groveIndex = Math.floor(inZone / TREES_PER_GROVE);
  const slot = inZone % TREES_PER_GROVE;
  const def = GROVE_SLOTS[slot]!;
  const origin = groveOrigin(zoneIndex, groveIndex);
  const jitterX = (hash01(index * 3.17) - 0.5) * 10;
  const jitterY = (hash01(index * 5.91) - 0.5) * 6;

  return {
    index,
    zoneIndex,
    groveIndex,
    slot,
    x: origin.x + def.x * GROVE_WIDTH + jitterX,
    y: origin.y + def.y * GROVE_HEIGHT + jitterY,
    kind: def.kind,
    size: def.size * (0.94 + hash01(index * 1.37) * 0.12),
  };
}

export function treesInGrove(zoneIndex: number, groveIndex: number, totalTrees: number): ForestTree[] {
  const start = zoneIndex * TREES_PER_ZONE + groveIndex * TREES_PER_GROVE;
  const end = Math.min(start + TREES_PER_GROVE, totalTrees);
  if (end <= start) return [];
  const trees: ForestTree[] = [];
  for (let i = start; i < end; i += 1) {
    trees.push(getTreeByIndex(i));
  }
  return trees;
}

function previousGrove(
  zoneIndex: number,
  groveIndex: number,
): { zoneIndex: number; groveIndex: number } | null {
  if (groveIndex > 0) return { zoneIndex, groveIndex: groveIndex - 1 };
  if (zoneIndex > 0) return { zoneIndex: zoneIndex - 1, groveIndex: GROVES_PER_ZONE - 1 };
  return null;
}

function sampleGrove(zoneIndex: number, groveIndex: number, totalTrees: number, take: number): ForestTree[] {
  const all = treesInGrove(zoneIndex, groveIndex, totalTrees);
  if (all.length <= take) return all;
  const step = all.length / take;
  const sampled: ForestTree[] = [];
  for (let i = 0; i < take; i += 1) {
    sampled.push(all[Math.min(all.length - 1, Math.floor(i * step))]!);
  }
  return sampled;
}

export function getForestView(
  totalCompleted: number,
  density: ForestViewDensity = 'preview',
  ensureIndex?: number | null,
): ForestView {
  const snapshot = deriveForestProgress(totalCompleted);
  const focus = { zoneIndex: snapshot.zoneIndex, groveIndex: snapshot.groveIndex };
  const cap = density === 'page' ? PAGE_TREE_CAP : PREVIEW_TREE_CAP;

  const current = treesInGrove(focus.zoneIndex, focus.groveIndex, snapshot.totalTrees);
  const prev = previousGrove(focus.zoneIndex, focus.groveIndex);

  let extras: ForestTree[] = [];
  if (prev) {
    extras = treesInGrove(prev.zoneIndex, prev.groveIndex, snapshot.totalTrees);
  }

  if (density === 'page' && focus.groveIndex >= 2) {
    extras = [
      ...sampleGrove(focus.zoneIndex, focus.groveIndex - 2, snapshot.totalTrees, 10),
      ...extras,
    ];
  }

  const seen = new Set<number>();
  const trees: ForestTree[] = [];
  for (const tree of [...extras, ...current]) {
    if (seen.has(tree.index)) continue;
    seen.add(tree.index);
    trees.push(tree);
    if (trees.length >= cap) break;
  }

  if (ensureIndex != null && ensureIndex >= 0 && !seen.has(ensureIndex)) {
    trees.push(getTreeByIndex(ensureIndex));
  }

  trees.sort((a, b) => a.y - b.y);

  const silhouettes: ForestSilhouette[] = [];
  const maxSilhouettes = density === 'page' ? 2 : 1;
  for (let i = 1; i <= maxSilhouettes; i += 1) {
    const zone = snapshot.zoneIndex - i;
    if (zone < 0) break;
    const origin = groveOrigin(zone, 0);
    silhouettes.push({
      x: origin.x + GROVE_WIDTH,
      y: origin.y + GROVE_HEIGHT * 0.55,
      width: GROVE_WIDTH * 1.85,
      height: GROVE_HEIGHT * 1.15,
    });
  }

  return { snapshot, trees, silhouettes, focus };
}

export function idleCamera(
  zoneIndex: number,
  groveIndex: number,
  viewW: number,
  viewH: number,
): ForestCamera {
  const center = groveCenter(zoneIndex, groveIndex);
  const zoom = Math.min(viewW / (GROVE_WIDTH * 0.88), viewH / (GROVE_HEIGHT * 0.8));
  return { x: center.x, y: center.y, zoom: Number.isFinite(zoom) && zoom > 0 ? zoom : 1 };
}

export function groveOverviewCamera(
  zoneIndex: number,
  groveIndex: number,
  viewW: number,
  viewH: number,
): ForestCamera {
  const idle = idleCamera(zoneIndex, groveIndex, viewW, viewH);
  return { ...idle, zoom: idle.zoom * 0.7 };
}

export function zoneOverviewCamera(zoneIndex: number, viewW: number, viewH: number): ForestCamera {
  const current = zoneCenter(zoneIndex);
  const next = groveCenter(zoneIndex + 1, 0);
  const idle = idleCamera(zoneIndex, 0, viewW, viewH);
  return {
    x: (current.x + next.x) / 2,
    y: current.y,
    zoom: idle.zoom * 0.36,
  };
}
