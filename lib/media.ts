import type { CSSProperties } from 'react';
import data from './media-placeholders.json';

/** Ảnh mờ siêu nhỏ và màu nền của từng ảnh trong public/media (tạo bằng `npm run media:placeholders`). */
const placeholders = data as Record<string, { blur: string; color: string }>;

/**
 * Biến CSS cho khung ảnh `.ph`: nền màu chủ đạo + ảnh mờ, để khung không trắng trơn lúc ảnh thật đang tải.
 * Chỉ gọi trong server component; bảng dữ liệu không bị đóng gói vào JS phía trình duyệt.
 */
export function ph(url?: string | null): CSSProperties | undefined {
  const p = url ? placeholders[url] : undefined;
  return p ? ({ '--ph': `url("${p.blur}")`, '--ph-c': p.color } as CSSProperties) : undefined;
}
