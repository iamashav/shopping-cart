import type { SVGProps } from "react";
import { BloomMarkPaths } from "./bloom-mark";

type CoffeeBagProps = SVGProps<SVGSVGElement> & {
  name: string;
  origin: string;
  roast: number;
  bagColor: string;
  labelColor?: string;
  inkColor?: string;
};

const CRIMP_XS = Array.from({ length: 22 }, (_, i) => 34 + i * 6);

function splitName(name: string): string[] {
  const words = name.split(" ");
  if (name.length <= 12 || words.length === 1) return [name];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}

export function CoffeeBag({
  name,
  origin,
  roast,
  bagColor,
  labelColor = "#f8f4ec",
  inkColor = "#3b261b",
  ...props
}: CoffeeBagProps) {
  const lines = splitName(name);
  const nameY = lines.length === 1 ? 162 : 154;

  return (
    <svg viewBox="0 0 200 260" role="img" aria-label={`${name} coffee bag`} {...props}>
      <path d="M30 58h140l8 182q0 10-10 10H32q-10 0-10-10z" fill={bagColor} />
      <path d="M30 58h14l-6 192h-6q-10 0-10-10z" fill="#000" opacity="0.08" />
      <path d="M156 58h14l8 182q0 10-10 10h-6z" fill="#fff" opacity="0.06" />
      <rect x="30" y="32" width="140" height="28" rx="2" fill={bagColor} />
      <rect x="30" y="32" width="140" height="28" rx="2" fill="#000" opacity="0.12" />
      {CRIMP_XS.map((x) => (
        <line key={x} x1={x} y1="34" x2={x} y2="58" stroke="#000" strokeWidth="1" opacity="0.1" />
      ))}
      <rect x="38" y="60" width="124" height="5" rx="2.5" fill="#d9d2c5" opacity="0.9" />

      <rect x="48" y="92" width="104" height="124" rx="6" fill={labelColor} />
      <g transform="translate(89 100) scale(0.69)">
        <BloomMarkPaths fill={bagColor} crease={labelColor} />
      </g>
      <text
        x="100"
        y="136"
        textAnchor="middle"
        fontSize="7"
        letterSpacing="2.5"
        fill={inkColor}
        opacity="0.7"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        BLOOM
      </text>
      <text
        textAnchor="middle"
        fontSize="14"
        fontWeight="600"
        fill={inkColor}
        style={{ fontFamily: "var(--font-fraunces)" }}
      >
        {lines.map((line, i) => (
          <tspan key={line} x="100" y={nameY + i * 16}>
            {line}
          </tspan>
        ))}
      </text>
      <text
        x="100"
        y="190"
        textAnchor="middle"
        fontSize="7.5"
        fill={inkColor}
        opacity="0.65"
        style={{ fontFamily: "var(--font-sans)" }}
        {...(origin.length > 20 && { textLength: 90, lengthAdjust: "spacingAndGlyphs" })}
      >
        {origin}
      </text>
      {[1, 2, 3, 4, 5].map((level) => (
        <circle
          key={level}
          cx={80 + (level - 1) * 10}
          cy="203"
          r="3"
          fill={level <= roast ? inkColor : "none"}
          stroke={inkColor}
          strokeWidth="1"
          opacity={level <= roast ? 0.85 : 0.35}
        />
      ))}
    </svg>
  );
}
