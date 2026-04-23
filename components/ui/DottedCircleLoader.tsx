'use client';

interface DottedCircleLoaderProps {
  size?: number;       // overall diameter in px, default 72
  dots?: number;       // number of dots, default 8
  color?: string;      // any CSS color, default '#ffffff'
  speed?: string;      // animation duration, default '1.2s'
  dark?: boolean;      // shorthand: sets color to #1f2937
}

export function DottedCircleLoader({
  size = 72,
  dots = 8,
  color,
  speed = '1.2s',
  dark = false,
}: DottedCircleLoaderProps) {
  const dotSize = Math.round(size * 0.14);          // ~10px at size=72
  const radius  = size / 2 - dotSize;               // derived, not hardcoded
  const resolvedColor = color ?? (dark ? '#1f2937' : '#ffffff');

  return (
    <div
      role="status"
      aria-label="Loading"
      style={{
        position: 'relative',
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      {Array.from({ length: dots }).map((_, i) => {
        const angle = (i / dots) * 2 * Math.PI;
        const x = size / 2 + radius * Math.cos(angle) - dotSize / 2;
        const y = size / 2 + radius * Math.sin(angle) - dotSize / 2;
        return (
          <span
            key={i}
            className="dcl-dot"
            style={{
              width: dotSize,
              height: dotSize,
              left: x,
              top: y,
              '--dcl-color': resolvedColor,
              '--dcl-speed': speed,
              animationDelay: `${(i / dots) * parseFloat(speed)}s`,
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
}
