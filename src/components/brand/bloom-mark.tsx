import type { SVGProps } from "react";

const PETAL_ANGLES = [0, 72, 144, 216, 288];

export function BloomMarkPaths({ fill, crease }: { fill: string; crease: string }) {
  return (
    <g>
      {PETAL_ANGLES.map((angle) => (
        <g key={angle} transform={`rotate(${angle} 16 16)`}>
          <ellipse cx="16" cy="8.6" rx="3.5" ry="6" fill={fill} />
          <path
            d="M16 3.6c-1.1 2.8 1.1 6.2 0 9.6"
            fill="none"
            stroke={crease}
            strokeWidth="0.9"
            strokeLinecap="round"
          />
        </g>
      ))}
    </g>
  );
}

export function BloomMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" {...props}>
      <BloomMarkPaths fill="var(--brand)" crease="var(--background)" />
    </svg>
  );
}
