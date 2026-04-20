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
 * LCP optimization: the initial JSX renders the FINAL value so Lighthouse
 * paints the LCP element immediately. The effect then resets to 0 and
 * animates up — this happens after first paint, so LCP is unaffected.
 *
 * Perf: writes textContent directly via ref (no React re-render per frame),
 * throttles to ~30fps, and uses CSS containment to avoid ancestor reflows.
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
      // Already showing final value from initial render — nothing to do.
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started.current) {
            started.current = true;
            // Reset to 0 only now (after LCP has been measured) and animate up.
            write(0);
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
        // Isolate layout/paint so per-frame text changes don't reflow ancestors.
        contain: "layout style paint",
        willChange: "contents",
      }}
    >
      {to}{suffix}
    </span>
  );
};

export default AnimatedCounter;
