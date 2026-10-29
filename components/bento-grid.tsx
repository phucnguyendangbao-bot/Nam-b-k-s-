import type { ReactNode } from 'react';

export function BentoGrid({ children, label }: { children: ReactNode; label: string }) {
  return <div className="bento-grid" aria-label={label}>{children}</div>;
}
export function BentoCard({ children, variant = 'standard' }: { children: ReactNode; variant?: 'large' | 'standard' | 'horizontal' | 'image' | 'text' }) {
  return <article className={`bento-card bento-${variant}`}>{children}</article>;
}
