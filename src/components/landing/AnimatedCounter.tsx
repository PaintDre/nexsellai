import { useEffect, useRef, useState } from "react";

interface AnimatedCounterProps {
  to: number;
  duration?: number;
  className?: string;
  suffix?: string;
}

/**
 * Counts from 0 → `to` once the element enters the viewport.
 * Respects prefers-reduced-motion (jumps to final value).
 */
const AnimatedCounter = ({ to, duration = 1400, className, suffix }: AnimatedCounterProps) => {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement | null>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setValue(to);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started.current) {
            started.current = true;
            const startTs = performance.now();
            const tick = (now: number) => {
              const p = Math.min(1, (now - startTs) / duration);
              // easeOutCubic
              const eased = 1 - Math.pow(1 - p, 3);
              setValue(Math.round(eased * to));
              if (p < 1) requestAnimationFrame(tick);
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
  }, [to, duration]);

  return (
    <span ref={ref} className={className}>
      {value}
      {suffix}
    </span>
  );
};

export default AnimatedCounter;
