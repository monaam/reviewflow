import type { SVGProps } from 'react';

interface BriefloopLogoProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  variant?: 'light' | 'dark' | 'auto';
  className?: string;
}

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
      viewBox="0 0 220 48"
      fill="none"
      role="img"
      aria-label="Briefloop"
      className={className}
      {...svgProps}
    >
      <title>Briefloop</title>

      {/* "Brief" — semibold */}
      <text
        x="0"
        y="36"
        fontFamily="'Inter', system-ui, -apple-system, sans-serif"
        fontWeight="700"
        fontSize="36"
        fill={fill}
        letterSpacing="-1"
      >
        Brief
      </text>

      {/* "loop" — light */}
      <text
        x="110"
        y="36"
        fontFamily="'Inter', system-ui, -apple-system, sans-serif"
        fontWeight="300"
        fontSize="36"
        fill={fill}
        letterSpacing="-0.5"
      >
        loop
      </text>
    </svg>
  );
}
