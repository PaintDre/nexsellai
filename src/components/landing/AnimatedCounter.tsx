import { useEffect, useRef } from "react";

interface AnimatedCounterProps {
  to: number;
  duration?: number;
  className?: string;
  suffix?: string;
}

/**
 * Counts from 0 → `to` once the element enters the viewport.
 * Respects prefers-reduced-motion (jumps to final value).
 *
 * Perf: writes textContent directly via ref (no React re-render per frame)
 * and throttles to ~30fps to minimize forced reflows on the LCP element.
 */
const AnimatedCounter = ({ to, duration = 1400, className, suffix = "" }: AnimatedCounterProps) => {
  const ref = useRef<HTMLSpanElement | null>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const write = (n: number) => {
      el.textContent = `${n}${suffix}`;
    };

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      write(to);
      return;
    }

    // Initial paint at 0 (avoids layout shift when animation starts)
    write(0);

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started.current) {
            started.current = true;
            const startTs = performance.now();
            let lastFrameTs = 0;
            const frameInterval = 1000 / 30; // throttle to ~30fps

            const tick = (now: number) => {
              if (now - lastFrameTs >= frameInterval) {
                lastFrameTs = now;
                const p = Math.min(1, (now - startTs) / duration);
                const eased = 1 - Math.pow(1 - p, 3);
                write(Math.round(eased * to));
                if (p >= 1) return;
              }
              requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
            io.disconnect();
          }
        });
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration, suffix]);

  // Reserve width based on final value to prevent width-driven reflow each frame.
  const reservedCh = `${to}${suffix}`.length;

  return (
    <span
      ref={ref}
      className={className}
      style={{
        display: "inline-block",
        minWidth: `${reservedCh}ch`,
        fontVariantNumeric: "tabular-nums",
        textAlign: "center",
      }}
    >
      0{suffix}
    </span>
  );
};

export default AnimatedCounter;
