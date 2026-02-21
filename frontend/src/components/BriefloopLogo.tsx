import type { SVGProps } from 'react';

interface BriefloopLogoProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  /** Color variant for different backgrounds */
  variant?: 'light' | 'dark' | 'auto';
  /** Additional CSS classes for sizing */
  className?: string;
}

/**
 * Briefloop SVG wordmark.
 *
 * "Brief" is rendered in semibold weight, "loop" in a lighter italic style.
 * The double-o in "loop" forms a connected infinity/loop motif.
 *
 * Default fill is Vivid Violet (#7C3AED). Accepts a `variant` prop:
 *   - 'light' — violet on light backgrounds
 *   - 'dark'  — soft lavender on dark backgrounds
 *   - 'auto'  — uses CSS currentColor so the parent can control it
 */
export function BriefloopLogo({
  variant = 'auto',
  className = '',
  ...svgProps
}: BriefloopLogoProps) {
  const fill =
    variant === 'light'
      ? '#7C3AED'
      : variant === 'dark'
        ? '#A78BFA'
        : 'currentColor';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 220 56"
      fill="none"
      role="img"
      aria-label="Briefloop"
      className={className}
      {...svgProps}
    >
      <title>Briefloop</title>

      {/* "Brief" in semibold */}
      <text
        x="0"
        y="40"
        fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
        fontWeight="600"
        fontSize="38"
        fill={fill}
        letterSpacing="-0.5"
      >
        Brief
      </text>

      {/* "l" of "loop" — light italic */}
      <text
        x="119"
        y="40"
        fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
        fontWeight="300"
        fontStyle="italic"
        fontSize="38"
        fill={fill}
      >
        l
      </text>

      {/*
        Infinity / loop motif replacing the double-o.
        Center sits at x=148, y=28 — vertically aligned with lowercase letter centers.
        Each lobe is ~13px wide so the total is ~52px, fitting between "l" and "p".
      */}
      <path
        d={[
          'M 148,28',
          'C 145,18 138,15 134,15',
          'C 128,15 125,20 125,28',
          'C 125,36 128,41 134,41',
          'C 138,41 145,38 148,28',
          'C 151,18 158,15 162,15',
          'C 168,15 171,20 171,28',
          'C 171,36 168,41 162,41',
          'C 158,41 151,38 148,28',
          'Z',
        ].join(' ')}
        fill="none"
        stroke={fill}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* "p" — light italic */}
      <text
        x="174"
        y="40"
        fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
        fontWeight="300"
        fontStyle="italic"
        fontSize="38"
        fill={fill}
      >
        p
      </text>
    </svg>
  );
}
