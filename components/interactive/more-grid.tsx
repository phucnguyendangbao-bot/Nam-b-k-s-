'use client';
import { Children, useState } from 'react';

/**
 * Lưới thẻ dài: chỉ hiện `limit` thẻ đầu, nút "Xem thêm" mở tiếp từng đợt, thẻ mới bay vào nối nhau.
 * Không JS thì hiện đủ (thẻ bị ẩn chỉ dưới lớp .nx-ready).
 */
export function MoreGrid({ children, limit = 12, step = 12, className = 'nb-card-grid', unit = 'hồ sơ' }: { children: React.ReactNode; limit?: number; step?: number; className?: string; unit?: string }) {
  const items = Children.toArray(children);
  const [shown, setShown] = useState(items.length > limit + 4 ? limit : items.length);
  const rest = items.length - shown;
  return (
    <div className="nx-more-grid" data-nx>
      <div className={className}>
        {items.map((child, i) => (
          <div key={i} className={`nx-more-item ${i >= shown ? 'is-later' : ''} ${i >= shown - step && i >= limit ? 'is-new' : ''}`} style={{ '--k': i % step } as React.CSSProperties}>{child}</div>
        ))}
      </div>
      {rest > 0 && (
        <p className="nx-more-row">
          <button type="button" className="nx-more-btn" onClick={() => setShown(n => Math.min(items.length, n + step))}>
            Xem thêm {Math.min(step, rest)} {unit} <small>· còn {rest}</small>
          </button>
          <button type="button" className="nx-more-all" onClick={() => setShown(items.length)}>Hiện tất cả</button>
        </p>
      )}
    </div>
  );
}
