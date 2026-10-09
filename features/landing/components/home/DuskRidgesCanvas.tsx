'use client';

import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '../../hooks/useHomeMotion';

const RIDGES = 6;
const PARTICLES = 36;
/** Ridge fill, back to front. */
const BACK_RGB = [74, 68, 76] as const;
const FRONT_RGB = [35, 35, 35] as const;
/** Ridges are sampled this many CSS pixels apart. */
const STEP_PX = 6;
const MAX_DPR = 2;

type Particle = { x: number; y: number; speed: number; phase: number };

function newParticles(): Particle[] {
  return Array.from({ length: PARTICLES }, () => ({
    x: Math.random(),
    y: 0.55 + Math.random() * 0.4,
    speed: 0.00004 + Math.random() * 0.00008,
    phase: Math.random(),
  }));
}

/**
 * The hero's "dusk ridges": six layered hills drifting slowly, with motes of
 * light rising off them and a little parallax that follows the pointer. It
 * stops drawing while off screen, and with reduced motion it draws one still
 * frame (redrawn only on resize).
 */
export function DuskRidgesCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const particles = newParticles();
    let pointer = 0;
    let pointerTarget = 0;

    const draw = (t: number, animate: boolean) => {
      const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) return;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      pointer += (pointerTarget - pointer) * 0.04;

      for (const p of particles) {
        if (animate) {
          p.y -= p.speed * 16;
          p.phase += 0.004;
          if (p.y < 0.25) {
            p.y = 0.9;
            p.x = Math.random();
          }
        }
        const alpha = Math.max(0, Math.sin(p.phase)) * Math.min(1, (p.y - 0.25) / 0.2) * 0.45;
        ctx.fillStyle = `rgba(255,232,214,${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, 1.1, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = 0; i < RIDGES; i++) {
        const k = i / (RIDGES - 1);
        const base = h * (0.6 + k * 0.3);
        const amp = h * (0.06 + k * 0.035);
        const offset = pointer * (10 + k * 40);
        const points: Array<[number, number]> = [];
        for (let x = -40; x <= w + 40; x += STEP_PX) {
          const nx = (x + offset) / w;
          const y =
            base -
            amp *
              (0.55 * Math.sin(nx * 2.1 * Math.PI + i * 1.7 + t * 0.00005 * (1 + k)) +
                0.3 * Math.sin(nx * 4.7 * Math.PI + i * 2.3 - t * 0.00007) +
                0.15 * Math.sin(nx * 10.3 * Math.PI + i * 0.9 + t * 0.0001));
          points.push([x, y]);
        }

        const trace = () => {
          ctx.beginPath();
          ctx.moveTo(points[0]![0], points[0]![1]);
          for (const [x, y] of points) ctx.lineTo(x, y);
        };

        trace();
        ctx.lineTo(w + 40, h);
        ctx.lineTo(-40, h);
        ctx.closePath();
        const [r, g, b] = BACK_RGB.map((v, j) => Math.round(v + (FRONT_RGB[j]! - v) * k));
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fill();

        trace();
        ctx.strokeStyle = `rgba(255,226,204,${0.2 - k * 0.12})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    };

    if (reducedMotion) {
      const still = () => draw(0, false);
      still();
      window.addEventListener('resize', still);
      return () => window.removeEventListener('resize', still);
    }

    let frame = 0;
    let visible = true;
    const loop = (t: number) => {
      if (visible) draw(t, true);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
    });
    observer.observe(canvas);

    const onPointer = (event: MouseEvent) => {
      pointerTarget = event.clientX / window.innerWidth - 0.5;
    };
    window.addEventListener('mousemove', onPointer, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('mousemove', onPointer);
    };
  }, [reducedMotion]);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}
