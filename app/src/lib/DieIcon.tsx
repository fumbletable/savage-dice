import type { DieType } from './dice';

interface Props {
  die: DieType;
  value: number;
  aced?: boolean;
  shaking?: boolean;
  size?: number;
}

export function DieIcon({ die, value, aced, shaking, size = 40 }: Props) {
  const shape = shapes[die];
  const cls = `die-icon ${aced ? 'aced' : ''} ${shaking ? 'shaking' : ''}`;
  return (
    <div className={cls} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <polygon
          points={shape}
          fill="var(--die-fill)"
          stroke="var(--die-stroke)"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--die-text)"
          fontSize={value >= 10 ? 32 : 38}
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
        >
          {value}
        </text>
      </svg>
    </div>
  );
}

// Polyhedral silhouettes — distinct shapes per die type
const shapes: Record<DieType, string> = {
  4:  '50,8 92,82 8,82',                                // triangle (tetrahedron)
  6:  '15,15 85,15 85,85 15,85',                        // square (cube)
  8:  '50,5 92,50 50,95 8,50',                          // diamond (octahedron)
  10: '50,5 90,35 75,92 25,92 10,35',                   // pentagon
  12: '50,5 88,28 88,72 50,95 12,72 12,28',             // hexagon
};
