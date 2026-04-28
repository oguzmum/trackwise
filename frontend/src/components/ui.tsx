import type { CSSProperties, ReactNode } from 'react';
import type { Category } from '../types';

interface CardProps {
  children: ReactNode;
  style?: CSSProperties;
  onClick?: () => void;
}

export const Card = ({ children, style = {}, onClick }: CardProps) => (
  <div onClick={onClick} style={{
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: 14, padding: '16px 18px',
    cursor: onClick ? 'pointer' : 'default', ...style,
  }}>
    {children}
  </div>
);

interface ProgressBarProps {
  value: number;
  color?: string;
  height?: number;
  style?: CSSProperties;
}

export const ProgressBar = ({ value, color = 'var(--accent-amber)', height = 4, style = {} }: ProgressBarProps) => (
  <div style={{ background: 'var(--bg-elevated)', borderRadius: height, overflow: 'hidden', height, ...style }}>
    <div style={{
      height: '100%', width: `${Math.max(0, Math.min(100, value))}%`,
      background: color, borderRadius: height,
      transition: 'width 0.6s cubic-bezier(0.34,1.2,0.64,1)',
    }} />
  </div>
);

interface CircleProgressProps {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  children?: ReactNode;
}

export const CircleProgress = ({ value, size = 80, stroke = 6, color = 'var(--accent-amber)', children }: CircleProgressProps) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-elevated)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.34,1.2,0.64,1)' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </div>
    </div>
  );
};

interface CategoryBadgeProps {
  category: Category | null;
  small?: boolean;
}

export const CategoryBadge = ({ category, small = false }: CategoryBadgeProps) => {
  const color = category?.color ?? '#888';
  const label = category?.name ?? '—';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: small ? 10 : 11, fontWeight: 600, letterSpacing: '0.06em',
      textTransform: 'uppercase', color,
      background: color + '22', borderRadius: 4,
      padding: small ? '2px 6px' : '3px 8px',
    }}>
      <span style={{ width: small ? 5 : 6, height: small ? 5 : 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
      {label}
    </span>
  );
};
