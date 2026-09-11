export const TREES_PER_GROVE = 25;
export const TREES_PER_ZONE = 100;
export const GROVES_PER_ZONE = TREES_PER_ZONE / TREES_PER_GROVE;

/** Wide, shallow grove so the pixel scene fills the card instead of a postage stamp. */
export const GROVE_WIDTH = 90;
export const GROVE_HEIGHT = 20;
export const ZONE_GAP = 8;

export type TreeKind = 'pine' | 'broadleaf' | 'cedar';

export type GroveSlot = {
  x: number;
  y: number;
  kind: TreeKind;
  /** 0 small, 1 medium, 2 tall */
  size: number;
};

/**
 * 25 integer cell positions for one grove.
 * Early slots sit near the centre; later ones fill the width without stacking.
 */
export const GROVE_SLOTS: GroveSlot[] = [
  { x: 44, y: 18, kind: 'pine', size: 2 },
  { x: 56, y: 18, kind: 'cedar', size: 1 },
  { x: 32, y: 18, kind: 'broadleaf', size: 1 },
  { x: 68, y: 18, kind: 'pine', size: 1 },
  { x: 20, y: 18, kind: 'cedar', size: 1 },
  { x: 80, y: 18, kind: 'pine', size: 1 },
  { x: 8, y: 18, kind: 'cedar', size: 1 },
  { x: 88, y: 18, kind: 'pine', size: 0 },
  { x: 40, y: 15, kind: 'cedar', size: 1 },
  { x: 52, y: 15, kind: 'pine', size: 0 },
  { x: 28, y: 15, kind: 'broadleaf', size: 0 },
  { x: 64, y: 15, kind: 'cedar', size: 1 },
  { x: 16, y: 15, kind: 'pine', size: 0 },
  { x: 76, y: 15, kind: 'cedar', size: 0 },
  { x: 46, y: 11, kind: 'pine', size: 0 },
  { x: 34, y: 11, kind: 'cedar', size: 0 },
  { x: 58, y: 11, kind: 'broadleaf', size: 0 },
  { x: 22, y: 11, kind: 'pine', size: 0 },
  { x: 70, y: 11, kind: 'cedar', size: 0 },
  { x: 10, y: 11, kind: 'pine', size: 0 },
  { x: 82, y: 11, kind: 'cedar', size: 0 },
  { x: 12, y: 16, kind: 'broadleaf', size: 0 },
  { x: 36, y: 16, kind: 'pine', size: 0 },
  { x: 60, y: 16, kind: 'cedar', size: 0 },
  { x: 84, y: 16, kind: 'pine', size: 0 },
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

export function deriveForestProgress(totalCompleted: number): ForestSnapshot {
  const totalTrees = Math.max(0, Math.floor(totalCompleted));
  let zoneIndex = Math.floor(totalTrees / TREES_PER_ZONE);
  let treesInZone = totalTrees % TREES_PER_ZONE;
  let groveIndex = Math.floor(treesInZone / TREES_PER_GROVE);
  let treesInGrove = treesInZone % TREES_PER_GROVE;

  // 25, 50, 100… belong to the grove just finished, not an empty next one.
  if (totalTrees > 0 && treesInGrove === 0) {
    if (groveIndex === 0) {
      zoneIndex -= 1;
      groveIndex = GROVES_PER_ZONE - 1;
      treesInZone = TREES_PER_ZONE;
    } else {
      groveIndex -= 1;
    }
    treesInGrove = TREES_PER_GROVE;
  }

  return {
    totalTrees,
    zoneIndex,
    treesInZone,
    groveIndex,
    treesInGrove,
    groveSize: TREES_PER_GROVE,
    remainingToGrove: TREES_PER_GROVE - treesInGrove,
    completedZones: Math.floor(totalTrees / TREES_PER_ZONE),
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
    x: origin.x + Math.floor(GROVE_WIDTH / 2),
    y: origin.y + Math.floor(GROVE_HEIGHT / 2) + 2,
  };
}

export function zoneCenter(zoneIndex: number): Vec2 {
  const a = groveCenter(zoneIndex, 0);
  const b = groveCenter(zoneIndex, GROVES_PER_ZONE - 1);
  return {
    x: Math.floor((a.x + b.x) / 2),
    y: Math.floor((a.y + b.y) / 2),
  };
}

export function getTreeByIndex(index: number): ForestTree {
  const zoneIndex = Math.floor(index / TREES_PER_ZONE);
  const inZone = index % TREES_PER_ZONE;
  const groveIndex = Math.floor(inZone / TREES_PER_GROVE);
  const slot = inZone % TREES_PER_GROVE;
  const def = GROVE_SLOTS[slot]!;
  const origin = groveOrigin(zoneIndex, groveIndex);

  return {
    index,
    zoneIndex,
    groveIndex,
    slot,
    x: origin.x + def.x,
    y: origin.y + def.y,
    kind: def.kind,
    size: def.size,
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

export function getForestView(
  totalCompleted: number,
  _density: ForestViewDensity = 'preview',
  ensureIndex?: number | null,
): ForestView {
  const snapshot = deriveForestProgress(totalCompleted);
  const focus = { zoneIndex: snapshot.zoneIndex, groveIndex: snapshot.groveIndex };
  const trees: ForestTree[] = treesInGrove(focus.zoneIndex, focus.groveIndex, snapshot.totalTrees);

  if (ensureIndex != null && ensureIndex >= 0 && !trees.some((tree) => tree.index === ensureIndex)) {
    trees.push(getTreeByIndex(ensureIndex));
  }

  trees.sort((a, b) => a.y - b.y || a.x - b.x);

  return { snapshot, trees, silhouettes: [], focus };
}

export function idleCamera(
  zoneIndex: number,
  groveIndex: number,
  _viewW: number,
  _viewH: number,
  _density: ForestViewDensity = 'preview',
): ForestCamera {
  const center = groveCenter(zoneIndex, groveIndex);
  return { x: center.x, y: center.y, zoom: 1 };
}

export function groveOverviewCamera(
  zoneIndex: number,
  groveIndex: number,
  viewW: number,
  viewH: number,
  density: ForestViewDensity = 'preview',
): ForestCamera {
  const idle = idleCamera(zoneIndex, groveIndex, viewW, viewH, density);
  return { ...idle, zoom: 0.84 };
}

export function zoneOverviewCamera(
  zoneIndex: number,
  viewW: number,
  viewH: number,
  density: ForestViewDensity = 'preview',
): ForestCamera {
  const current = groveCenter(zoneIndex, 3);
  const next = groveCenter(zoneIndex + 1, 0);
  const idle = idleCamera(zoneIndex, 0, viewW, viewH, density);
  return {
    x: Math.floor((current.x + next.x) / 2),
    y: idle.y,
    zoom: 0.62,
  };
}
