import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { isMobileViewport } from '@/features/forest/forestAnimations';
import {
  renderForest,
  sizeForestCanvas,
  type ForestScene,
} from '@/features/forest/forestRenderer';

export type ForestCanvasHandle = {
  render: (scene: ForestScene) => void;
};

type ForestCanvasProps = {
  className?: string;
  enableParallax: boolean;
  onViewSize: (width: number, height: number) => void;
  onParallax: (x: number, y: number) => void;
};

export const ForestCanvas = forwardRef<ForestCanvasHandle, ForestCanvasProps>(
  function ForestCanvas({ className = '', enableParallax, onViewSize, onParallax }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sceneRef = useRef<ForestScene | null>(null);
    const dprRef = useRef(1);
    const onViewSizeRef = useRef(onViewSize);
    const onParallaxRef = useRef(onParallax);

    onViewSizeRef.current = onViewSize;
    onParallaxRef.current = onParallax;

    const paint = (scene: ForestScene) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) return;
      sceneRef.current = scene;
      ctx.imageSmoothingEnabled = false;
      renderForest(ctx, scene, dprRef.current);
    };

    useImperativeHandle(ref, () => ({
      render: paint,
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const measure = () => {
        const { cssW, cssH, dpr } = sizeForestCanvas(canvas, isMobileViewport());
        dprRef.current = dpr;
        onViewSizeRef.current(cssW, cssH);
        if (sceneRef.current) {
          paint({ ...sceneRef.current, viewW: cssW, viewH: cssH });
        }
      };

      measure();
      const observer = new ResizeObserver(() => measure());
      observer.observe(canvas);
      return () => observer.disconnect();
    }, []);

    return (
      <canvas
        ref={canvasRef}
        className={`block h-full w-full bg-transparent ${className}`}
        aria-hidden
        onPointerMove={(event) => {
          if (!enableParallax) return;
          const rect = event.currentTarget.getBoundingClientRect();
          if (rect.width < 1 || rect.height < 1) return;
          const nx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
          const ny = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
          onParallaxRef.current(nx * 0.6, ny * 0.4);
        }}
        onPointerLeave={() => {
          if (!enableParallax) return;
          onParallaxRef.current(0, 0);
        }}
      />
    );
  },
);
