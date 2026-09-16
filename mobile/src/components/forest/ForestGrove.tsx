import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  GROVE_HEIGHT,
  GROVE_WIDTH,
  getForestView,
  groveOrigin,
  idleCamera,
  type ForestViewDensity,
  type TreeKind,
} from '../../features/forest/forestProgress';
import { useTheme } from '../../features/theme/useTheme';

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

type Canopy = { light: string; mid: string; dark: string };

function ink(ch: string, canopy: Canopy): string | null {
  if (ch === 't' || ch === 'd') return canopy.dark;
  if (ch === 'm') return canopy.mid;
  if (ch === 'l') return canopy.light;
  return null;
}

type Pixel = { key: string; left: number; top: number; width: number; height: number; color: string };

function worldToScreen(
  gx: number,
  gy: number,
  camera: { x: number; y: number },
  cell: number,
  viewW: number,
  viewH: number,
) {
  return {
    left: Math.floor((gx - camera.x) * cell + viewW / 2),
    top: Math.floor((gy - camera.y) * cell + viewH / 2),
  };
}

export function ForestGrove({
  totalCompleted,
  density = 'preview',
  height,
}: {
  totalCompleted: number;
  density?: ForestViewDensity;
  height: number;
}) {
  const { theme, colors } = useTheme();
  const [width, setWidth] = useState(0);

  const pixels = useMemo(() => {
    if (width < 8) return [] as Pixel[];
    const canopy: Canopy =
      theme === 'dark'
        ? { light: '#4bb87a', mid: '#348a5a', dark: '#256344' }
        : { light: '#40916c', mid: '#2d6a4f', dark: '#1b4332' };
    const view = getForestView(totalCompleted, density);
    const camera = idleCamera(view.focus.zoneIndex, view.focus.groveIndex, width, height, density);
    const padX = density === 'page' ? 4 : 2;
    const fit = Math.min(width / (GROVE_WIDTH + padX), height / (GROVE_HEIGHT + 1));
    const cell = Math.max(3, Math.floor(fit * camera.zoom));
    const items: Pixel[] = [];

    const origin = groveOrigin(view.focus.zoneIndex, view.focus.groveIndex);
    const soilCount = density === 'page' ? 28 : 18;
    for (let i = 0; i < soilCount; i += 1) {
      if ((i * 5) % 3 === 0) continue;
      const gx = origin.x + 3 + ((i * 13) % (GROVE_WIDTH - 6));
      const gy = origin.y + GROVE_HEIGHT - 3 - (i % 2);
      const pos = worldToScreen(gx, gy, camera, cell, width, height);
      if (pos.left + cell < 0 || pos.top + cell < 0 || pos.left > width || pos.top > height) continue;
      items.push({
        key: `soil-${i}`,
        left: pos.left,
        top: pos.top,
        width: cell,
        height: cell,
        color: colors.line,
      });
    }

    for (const tree of view.trees) {
      const frames = SPRITES[tree.kind];
      const rows = frames[Math.max(0, Math.min(frames.length - 1, Math.round(tree.size)))] ?? frames[0]!;
      const spriteH = rows.length;
      const spriteW = rows[0]?.length ?? 0;
      const left = tree.x - Math.floor(spriteW / 2);
      const top = tree.y - (spriteH - 1);
      rows.forEach((line, row) => {
        let col = 0;
        while (col < line.length) {
          const color = ink(line[col] ?? ' ', canopy);
          if (!color) {
            col += 1;
            continue;
          }
          let run = 1;
          while (col + run < line.length && ink(line[col + run] ?? ' ', canopy) === color) {
            run += 1;
          }
          const pos = worldToScreen(left + col, top + row, camera, cell, width, height);
          if (!(pos.left + cell * run < 0 || pos.top + cell < 0 || pos.left > width || pos.top > height)) {
            items.push({
              key: `t${tree.index}-${row}-${col}`,
              left: pos.left,
              top: pos.top,
              width: cell * run,
              height: cell,
              color,
            });
          }
          col += run;
        }
      });
    }

    return items;
  }, [colors.line, density, height, theme, totalCompleted, width]);

  return (
    <View
      style={[styles.scene, { height, backgroundColor: colors.bg }]}
      onLayout={(event) => setWidth(Math.round(event.nativeEvent.layout.width))}
    >
      {pixels.map((pixel) => (
        <View
          key={pixel.key}
          style={{
            position: 'absolute',
            left: pixel.left,
            top: pixel.top,
            width: pixel.width,
            height: pixel.height,
            backgroundColor: pixel.color,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  scene: {
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
  },
});
