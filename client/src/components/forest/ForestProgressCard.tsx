import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ForestCanvas, type ForestCanvasHandle } from '@/components/forest/ForestCanvas';
import { ForestStats } from '@/components/forest/ForestStats';
import {
  advanceParticles,
  isMobileViewport,
  PLUS_ONE_MS,
  prefersReducedMotion,
  spawnGrowParticles,
  startAnimationLoop,
  TREE_GROW_MS,
  type ForestParticle,
} from '@/features/forest/forestAnimations';
import {
  deriveForestProgress,
  getForestView,
  getTreeByIndex,
  idleCamera,
  isGroveComplete,
  isZoneComplete,
  TREES_PER_GROVE,
  type ForestCamera,
  type ForestViewDensity,
} from '@/features/forest/forestProgress';
import { readForestPalette, type ForestScene } from '@/features/forest/forestRenderer';
import { useTheme } from '@/features/theme/useTheme';

export type ForestBanner = 'grove-completed' | 'new-grove' | 'new-zone' | null;

type ForestProgressCardProps = {
  totalCompleted: number;
  completedToday: number;
  layout?: 'compact' | 'expanded';
  exploreHref?: string | null;
  monthLabel?: string;
};

type HudState = {
  trees: number;
  groveCurrent: number;
  remaining: number;
  plusOne: boolean;
  banner: ForestBanner;
};

function settledHud(totalCompleted: number): HudState {
  const snapshot = deriveForestProgress(totalCompleted);
  return {
    trees: snapshot.totalTrees,
    groveCurrent: snapshot.treesInGrove,
    remaining: snapshot.remainingToGrove,
    plusOne: false,
    banner: null,
  };
}

function bannerKey(banner: ForestBanner): string | null {
  if (banner === 'grove-completed') return 'forest.groveCompleted';
  if (banner === 'new-grove') return 'forest.newGrove';
  if (banner === 'new-zone') return 'forest.newZone';
  return null;
}

export function ForestProgressCard({
  totalCompleted,
  completedToday,
  layout = 'compact',
  exploreHref = '/forest',
  monthLabel,
}: ForestProgressCardProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const density: ForestViewDensity = layout === 'expanded' ? 'page' : 'preview';
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<ForestCanvasHandle>(null);
  const stopAnimRef = useRef<(() => void) | null>(null);
  const prevTotalRef = useRef<number | null>(null);
  const inViewRef = useRef(true);
  const viewSizeRef = useRef({ w: 420, h: 160 });
  const parallaxRef = useRef({ x: 0, y: 0 });
  const cameraRef = useRef<ForestCamera>(idleCamera(0, 0, 420, 160, 'preview'));
  const particlesRef = useRef<ForestParticle[]>([]);
  const growRef = useRef({ index: null as number | null, progress: 1 });
  const lastFrameRef = useRef(0);
  const reduceMotionRef = useRef(false);
  const mobileRef = useRef(false);

  const [hud, setHud] = useState<HudState>(() => settledHud(totalCompleted));
  const [desktopParallax, setDesktopParallax] = useState(
    () => typeof window !== 'undefined' && !prefersReducedMotion() && !isMobileViewport(),
  );

  const paint = useCallback(
    (total: number, now = performance.now()) => {
      const view = getForestView(total, density, growRef.current.index);
      const palette = readForestPalette(rootRef.current);
      const { w, h } = viewSizeRef.current;
      const scene: ForestScene = {
        trees: view.trees,
        silhouettes: view.silhouettes,
        growingIndex: growRef.current.index,
        growProgress: growRef.current.progress,
        camera: cameraRef.current,
        parallax: parallaxRef.current,
        particles: particlesRef.current,
        palette,
        reducedEffects: mobileRef.current || reduceMotionRef.current,
        density,
        viewW: w,
        viewH: h,
        now,
        focus: view.focus,
      };
      canvasRef.current?.render(scene);
    },
    [density],
  );

  const settle = useCallback(
    (total: number) => {
      stopAnimRef.current?.();
      stopAnimRef.current = null;
      const snapshot = deriveForestProgress(total);
      const { w, h } = viewSizeRef.current;
      cameraRef.current = idleCamera(snapshot.zoneIndex, snapshot.groveIndex, w, h, density);
      growRef.current = { index: null, progress: 1 };
      particlesRef.current = [];
      setHud(settledHud(total));
      paint(total);
    },
    [density, paint],
  );

  const playCompletion = useCallback(
    (fromTotal: number, toTotal: number) => {
      stopAnimRef.current?.();
      const { w, h } = viewSizeRef.current;
      const fromSnap = deriveForestProgress(fromTotal);
      const toSnap = deriveForestProgress(toTotal);
      const zoneDone = isZoneComplete(toTotal);
      const groveDone = isGroveComplete(toTotal);
      const startedNewZone = !zoneDone && fromSnap.zoneIndex !== toSnap.zoneIndex;
      const startedNewGrove =
        !groveDone && !startedNewZone && fromSnap.groveIndex !== toSnap.groveIndex;
      const kind = zoneDone
        ? 'zone'
        : groveDone
          ? 'grove'
          : startedNewZone
            ? 'new-zone'
            : startedNewGrove
              ? 'new-grove'
              : 'grow';
      const growingIndex = toTotal - 1;
      const growTree = getTreeByIndex(growingIndex);
      const start = performance.now();
      lastFrameRef.current = start;

      const fromCam = idleCamera(fromSnap.zoneIndex, fromSnap.groveIndex, w, h, density);
      const toCam = idleCamera(toSnap.zoneIndex, toSnap.groveIndex, w, h, density);
      const needsCam = kind === 'new-grove' || kind === 'new-zone';

      const growMs = TREE_GROW_MS;
      const plusUntil = PLUS_ONE_MS;
      const groveBannerFrom = growMs - 60;
      const groveBannerUntil = groveBannerFrom + 560;
      const totalMs = growMs + (kind === 'grow' ? 0 : 420);

      cameraRef.current = needsCam ? toCam : fromCam;
      growRef.current = { index: growingIndex, progress: 0 };
      particlesRef.current = spawnGrowParticles(
        { x: growTree.x, y: growTree.y - 2 },
        growingIndex,
        start,
        mobileRef.current || reduceMotionRef.current ? 2 : 4,
      );

      setHud({
        trees: fromTotal,
        groveCurrent: fromSnap.treesInGrove,
        remaining: Math.max(0, TREES_PER_GROVE - fromSnap.treesInGrove),
        plusOne: true,
        banner: null,
      });

      stopAnimRef.current = startAnimationLoop((now) => {
        if (!inViewRef.current) {
          settle(toTotal);
          return false;
        }

        const elapsed = now - start;
        const dt = Math.min(48, now - lastFrameRef.current);
        lastFrameRef.current = now;
        const growT = Math.min(1, elapsed / growMs);
        const growEase = 1 - (1 - growT) ** 3;
        growRef.current =
          growT < 1 ? { index: growingIndex, progress: growEase } : { index: null, progress: 1 };

        particlesRef.current = advanceParticles(particlesRef.current, now, dt);
        cameraRef.current = needsCam ? toCam : fromCam;

        const groveCurrent =
          fromSnap.treesInGrove + (toSnap.treesInGrove - fromSnap.treesInGrove) * growEase;

        let banner: ForestBanner = null;
        if (kind !== 'grow' && elapsed >= groveBannerFrom && elapsed < groveBannerUntil) {
          if (kind === 'new-zone') banner = 'new-zone';
          else if (kind === 'new-grove') banner = 'new-grove';
          else banner = 'grove-completed';
        }

        setHud({
          trees: Math.round(fromTotal + (toTotal - fromTotal) * growEase),
          groveCurrent,
          remaining: Math.max(0, Math.round(TREES_PER_GROVE - groveCurrent)),
          plusOne: elapsed < plusUntil,
          banner,
        });

        paint(toTotal, now);
        if (elapsed >= totalMs) {
          settle(toTotal);
          return false;
        }
        return true;
      });
    },
    [density, paint, settle],
  );

  useEffect(() => {
    reduceMotionRef.current = prefersReducedMotion();
    mobileRef.current = isMobileViewport();
    setDesktopParallax(!reduceMotionRef.current && !mobileRef.current);

    const onChange = () => {
      reduceMotionRef.current = prefersReducedMotion();
      mobileRef.current = isMobileViewport();
      setDesktopParallax(!reduceMotionRef.current && !mobileRef.current);
      if (!stopAnimRef.current) paint(prevTotalRef.current ?? totalCompleted);
    };

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = window.matchMedia('(max-width: 767px)');
    motion.addEventListener('change', onChange);
    mobile.addEventListener('change', onChange);
    return () => {
      motion.removeEventListener('change', onChange);
      mobile.removeEventListener('change', onChange);
    };
  }, [paint, totalCompleted]);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = Boolean(entry?.isIntersecting);
        inViewRef.current = visible;
        if (!visible) {
          stopAnimRef.current?.();
          stopAnimRef.current = null;
          growRef.current = { index: null, progress: 1 };
          particlesRef.current = [];
          const total = prevTotalRef.current ?? totalCompleted;
          const snapshot = deriveForestProgress(total);
          const { w, h } = viewSizeRef.current;
          cameraRef.current = idleCamera(snapshot.zoneIndex, snapshot.groveIndex, w, h, density);
          setHud(settledHud(total));
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [density, totalCompleted]);

  useEffect(() => {
    const prev = prevTotalRef.current;
    prevTotalRef.current = totalCompleted;

    if (prev === null) {
      settle(totalCompleted);
      return;
    }
    if (prev === totalCompleted) return;

    const canAnimate =
      inViewRef.current && !reduceMotionRef.current && totalCompleted === prev + 1;

    if (canAnimate) {
      playCompletion(prev, totalCompleted);
      return;
    }

    settle(totalCompleted);
  }, [playCompletion, settle, totalCompleted]);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      if (!stopAnimRef.current) paint(totalCompleted);
    });
    return () => window.cancelAnimationFrame(id);
  }, [paint, theme, totalCompleted]);

  useEffect(() => {
    return () => stopAnimRef.current?.();
  }, []);

  const onViewSize = useCallback(
    (width: number, height: number) => {
      viewSizeRef.current = { w: width, h: height };
      if (!stopAnimRef.current) {
        const snapshot = deriveForestProgress(totalCompleted);
        cameraRef.current = idleCamera(snapshot.zoneIndex, snapshot.groveIndex, width, height, density);
        paint(totalCompleted);
      }
    },
    [density, paint, totalCompleted],
  );

  const onParallax = useCallback(
    (x: number, y: number) => {
      parallaxRef.current = {
        x: Math.max(-1, Math.min(1, x)),
        y: Math.max(-1, Math.min(1, y)),
      };
      if (!stopAnimRef.current) {
        paint(totalCompleted);
      }
    },
    [paint, totalCompleted],
  );

  const compact = layout === 'compact';
  const label = bannerKey(hud.banner);

  return (
    <section
      ref={rootRef}
      className={
        compact
          ? 'overflow-hidden rounded-2xl bg-panel shadow-sm ring-1 ring-line'
          : 'overflow-hidden rounded-3xl bg-panel p-5 shadow-sm ring-1 ring-line'
      }
      aria-label={t('forest.title')}
    >
      {compact ? (
        <div className="flex min-h-0 flex-col md:h-[188px] md:flex-row">
          <div className="min-w-0 px-4 pt-3 pb-2 md:flex md:w-[34%] md:flex-col md:justify-center md:overflow-hidden md:py-3 md:pr-3 md:pl-4">
            <ForestStats
              trees={hud.trees}
              treesToday={completedToday}
              groveCurrent={hud.groveCurrent}
              groveSize={TREES_PER_GROVE}
              remaining={hud.remaining}
              plusOne={hud.plusOne}
              exploreHref={exploreHref}
              variant="aside"
              monthLabel={monthLabel}
            />
          </div>
          <div className="relative h-[176px] overflow-hidden border-t border-line/60 md:h-auto md:min-h-0 md:flex-1 md:border-t-0 md:border-l md:border-line/60">
            <ForestCanvas
              ref={canvasRef}
              enableParallax={desktopParallax}
              onViewSize={onViewSize}
              onParallax={onParallax}
            />
            {label ? (
              <div className="pointer-events-none absolute inset-x-0 top-2.5 flex justify-center px-3">
                <span className="animate-fade rounded-full bg-panel/85 px-3 py-1 text-[11px] font-semibold tracking-wide text-brand-500 uppercase ring-1 ring-line/80">
                  {t(label)}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <>
          <ForestStats
            trees={hud.trees}
            treesToday={completedToday}
            groveCurrent={hud.groveCurrent}
            groveSize={TREES_PER_GROVE}
            remaining={hud.remaining}
            plusOne={hud.plusOne}
            exploreHref={exploreHref}
            variant="banner"
            monthLabel={monthLabel}
          />
          <div className="relative mt-4 h-56 overflow-hidden border-t border-line/60 sm:h-64">
            <ForestCanvas
              ref={canvasRef}
              enableParallax={desktopParallax}
              onViewSize={onViewSize}
              onParallax={onParallax}
            />
            {label ? (
              <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center px-3">
                <span className="animate-fade rounded-full bg-panel/85 px-3 py-1 text-xs font-semibold tracking-wide text-brand-500 uppercase ring-1 ring-line/80">
                  {t(label)}
                </span>
              </div>
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}
