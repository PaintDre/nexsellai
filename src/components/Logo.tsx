import { memo } from "react";

interface LogoProps {
  className?: string;
  /** Pixel size for both width & height. Defaults to 32. */
  size?: number;
  /** Optional aria-label override */
  title?: string;
}

/**
 * Inline SVG logo for Nexsell.
 *
 * Replaces the previous /logo-ns.png (~101KB) which was the largest non-script
 * resource on every page load. SVG inline = 0 network requests, scales perfectly,
 * inherits `currentColor` so it themes itself with the parent text color when needed.
 *
 * Visual: an "N" mark in Nexsell emerald (#2E9B63) on a rounded square background.
 */
const Logo = memo(({ className = "", size = 32, title = "Nexsell" }: LogoProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 64 64"
    width={size}
    height={size}
    role="img"
    aria-label={title}
    className={className}
  >
    <title>{title}</title>
    {/* Rounded square background — Nexsell emerald */}
    <rect width="64" height="64" rx="14" fill="#2E9B63" />
    {/* Stylized "N" — two verticals + diagonal */}
    <path
      d="M18 18 L18 46 L24 46 L24 28.5 L40 46 L46 46 L46 18 L40 18 L40 35.5 L24 18 Z"
      fill="#FFFFFF"
    />
  </svg>
));

Logo.displayName = "Logo";

export default Logo;
