import { useEffect, useRef } from "react";

/**
 * Adds `is-visible` class to elements with `.reveal-on-scroll` once they
 * enter the viewport. Cheap, IntersectionObserver-based, runs once.
 */
export function useScrollReveal(deps: unknown[] = []) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return;

    const targets = root.querySelectorAll<HTMLElement>(".reveal-on-scroll");
    if (!targets.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return rootRef;
}
