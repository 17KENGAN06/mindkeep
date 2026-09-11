import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ForestCanvas, type ForestCanvasHandle } from '@/components/forest/ForestCanvas';
import { ForestStats } from '@/components/forest/ForestStats';
import {
  advanceParticles,
  cameraPulse,
  isMobileViewport,
  PLUS_ONE_MS,
  prefersReducedMotion,
  spawnGrowParticles,
  spawnMilestoneParticles,
  startAnimationLoop,
  TREE_GROW_MS,
  type ForestParticle,
} from '@/features/forest/forestAnimations';
import {
  deriveForestProgress,
  getForestView,
  getTreeByIndex,
  groveCenter,
  groveNumberInZone,
  groveOrdinal,
  grovesFilledInZone,
  idleCamera,
  isGroveComplete,
  isZoneComplete,
  remainingToZone,
  TREES_PER_GROVE,
  type ForestCamera,
  type ForestSnapshot,
  type ForestViewDensity,
} from '@/features/forest/forestProgress';
import { readForestPalette, type ForestScene } from '@/features/forest/forestRenderer';
import { useTheme } from '@/features/theme/useTheme';

export type ForestBanner =
  | 'grove-1'
  | 'grove-2'
  | 'grove-3'
  | 'zone'
  | 'new-grove'
  | 'new-zone'
  | null;

type HudState = {
  trees: number;
  groveCurrent: number;
  groveNumber: number;
  grovesFilled: number;
  completedZones: number;
  remaining: number;
  remainingZone: number;
  plusOne: boolean;
  banner: ForestBanner;
  celebrateGrove: number | null;
  celebrateZone: boolean;
};

function hudFromSnapshot(
  snapshot: ForestSnapshot,
  extra: Partial<HudState> = {},
): HudState {
  return {
    trees: snapshot.totalTrees,
    groveCurrent: snapshot.treesInGrove,
    groveNumber: groveNumberInZone(snapshot),
    grovesFilled: grovesFilledInZone(snapshot),
    completedZones: snapshot.completedZones,
    remaining: snapshot.remainingToGrove,
    remainingZone: remainingToZone(snapshot),
    plusOne: false,
    banner: null,
    celebrateGrove: null,
    celebrateZone: false,
    ...extra,
  };
}

function settledHud(totalCompleted: number): HudState {
  return hudFromSnapshot(deriveForestProgress(totalCompleted));
}

function milestoneBanner(kind: 'grove' | 'zone' | 'new-grove' | 'new-zone', snapshot: ForestSnapshot): ForestBanner {
  if (kind === 'zone' || kind === 'new-zone') return kind === 'new-zone' ? 'new-zone' : 'zone';
  if (kind === 'new-grove') return 'new-grove';
  const ordinal = groveOrdinal(snapshot.completedGroves);
  if (ordinal === 1) return 'grove-1';
  if (ordinal === 2) return 'grove-2';
  if (ordinal === 3) return 'grove-3';
  return 'zone';
}

function bannerCopy(banner: ForestBanner): { title: string; hint: string } | null {
  if (banner === 'grove-1') return { title: 'forest.groveComplete1', hint: 'forest.groveHint1' };
  if (banner === 'grove-2') return { title: 'forest.groveComplete2', hint: 'forest.groveHint2' };
  if (banner === 'grove-3') return { title: 'forest.groveComplete3', hint: 'forest.groveHint3' };
  if (banner === 'zone') return { title: 'forest.zoneComplete', hint: 'forest.zoneHint' };
  if (banner === 'new-grove') return { title: 'forest.newGrove', hint: 'forest.newGroveHint' };
  if (banner === 'new-zone') return { title: 'forest.newZone', hint: 'forest.newZoneHint' };
  return null;
}

type ForestProgressCardProps = {
  totalCompleted: number;
  completedToday: number;
  layout?: 'compact' | 'expanded';
  exploreHref?: string | null;
  monthLabel?: string;
};

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
  const bannerTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

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
      if (bannerTimerRef.current != null) {
        window.clearTimeout(bannerTimerRef.current);
        bannerTimerRef.current = null;
      }
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
      if (bannerTimerRef.current != null) {
        window.clearTimeout(bannerTimerRef.current);
        bannerTimerRef.current = null;
      }
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
      const milestone = kind === 'grove' || kind === 'zone';
      const quiet = mobileRef.current || reduceMotionRef.current;

      const growMs = TREE_GROW_MS;
      const plusUntil = PLUS_ONE_MS;
      const extraMs = kind === 'zone' ? 1200 : kind === 'grove' ? 980 : kind === 'new-zone' ? 720 : kind === 'new-grove' ? 560 : 0;
      const bannerFrom = milestone || needsCam ? growMs * 0.45 : Number.POSITIVE_INFINITY;
      const totalMs = growMs + extraMs;

      const baseCam = needsCam ? toCam : fromCam;
      cameraRef.current = baseCam;
      growRef.current = { index: growingIndex, progress: 0 };

      const center = groveCenter(toSnap.zoneIndex, toSnap.groveIndex);
      particlesRef.current = [
        ...spawnGrowParticles(
          { x: growTree.x, y: growTree.y - 2 },
          growingIndex,
          start,
          quiet ? 2 : 4,
        ),
        ...(milestone
          ? spawnMilestoneParticles(center, start, quiet ? 5 : kind === 'zone' ? 16 : 10)
          : []),
      ];

      setHud(
        hudFromSnapshot(fromSnap, {
          plusOne: true,
        }),
      );

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
        cameraRef.current = milestone
          ? cameraPulse(baseCam, elapsed, totalMs, kind === 'zone' ? 0.11 : 0.07)
          : baseCam;

        const groveCurrent =
          fromSnap.treesInGrove + (toSnap.treesInGrove - fromSnap.treesInGrove) * growEase;
        const showBanner = kind !== 'grow' && elapsed >= bannerFrom && elapsed < totalMs - 90;
        const banner = showBanner ? milestoneBanner(kind, toSnap) : null;

        setHud(
          hudFromSnapshot(toSnap, {
            trees: Math.round(fromTotal + (toTotal - fromTotal) * growEase),
            groveCurrent,
            remaining: Math.max(0, Math.round(TREES_PER_GROVE - groveCurrent)),
            plusOne: elapsed < plusUntil,
            banner,
            celebrateGrove: milestone && showBanner ? groveOrdinal(toSnap.completedGroves) : null,
            celebrateZone: (kind === 'zone' || kind === 'new-zone') && showBanner,
          }),
        );

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
    if (inViewRef.current && totalCompleted === prev + 1) {
      const toSnap = deriveForestProgress(totalCompleted);
      const zoneDone = isZoneComplete(totalCompleted);
      const groveDone = isGroveComplete(totalCompleted);
      if (groveDone || zoneDone) {
        const banner = milestoneBanner(zoneDone ? 'zone' : 'grove', toSnap);
        setHud(
          hudFromSnapshot(toSnap, {
            banner,
            celebrateGrove: groveDone ? groveOrdinal(toSnap.completedGroves) : null,
            celebrateZone: zoneDone,
          }),
        );
        bannerTimerRef.current = window.setTimeout(() => {
          setHud(settledHud(totalCompleted));
          bannerTimerRef.current = null;
        }, 1400);
      }
    }
  }, [playCompletion, settle, totalCompleted]);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      if (!stopAnimRef.current) paint(totalCompleted);
    });
    return () => window.cancelAnimationFrame(id);
  }, [paint, theme, totalCompleted]);

  useEffect(() => {
    return () => {
      stopAnimRef.current?.();
      if (bannerTimerRef.current != null) window.clearTimeout(bannerTimerRef.current);
    };
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
  const banner = bannerCopy(hud.banner);

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
        <div className="flex min-h-0 flex-col md:h-[216px] md:flex-row">
          <div className="min-w-0 px-4 pt-3 pb-2 md:flex md:w-[36%] md:flex-col md:justify-center md:overflow-hidden md:py-3 md:pr-3 md:pl-4">
            <ForestStats
              trees={hud.trees}
              treesToday={completedToday}
              groveCurrent={hud.groveCurrent}
              groveSize={TREES_PER_GROVE}
              groveNumber={hud.groveNumber}
              grovesFilled={hud.grovesFilled}
              completedZones={hud.completedZones}
              remaining={hud.remaining}
              remainingZone={hud.remainingZone}
              plusOne={hud.plusOne}
              celebrateGrove={hud.celebrateGrove}
              celebrateZone={hud.celebrateZone}
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
            {banner ? (
              <div className="pointer-events-none absolute inset-x-0 top-2.5 flex justify-center px-3">
                <div className="animate-fade max-w-[92%] rounded-2xl bg-panel/90 px-3 py-1.5 text-center shadow-sm ring-1 ring-brand-400/35">
                  <p className="text-[11px] font-semibold tracking-wide text-brand-500 uppercase">
                    {t(banner.title)}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted">{t(banner.hint)}</p>
                </div>
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
            groveNumber={hud.groveNumber}
            grovesFilled={hud.grovesFilled}
            completedZones={hud.completedZones}
            remaining={hud.remaining}
            remainingZone={hud.remainingZone}
            plusOne={hud.plusOne}
            celebrateGrove={hud.celebrateGrove}
            celebrateZone={hud.celebrateZone}
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
            {banner ? (
              <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center px-3">
                <div className="animate-fade max-w-md rounded-2xl bg-panel/90 px-4 py-2 text-center shadow-sm ring-1 ring-brand-400/35">
                  <p className="text-xs font-semibold tracking-wide text-brand-500 uppercase">
                    {t(banner.title)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted">{t(banner.hint)}</p>
                </div>
              </div>
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}
