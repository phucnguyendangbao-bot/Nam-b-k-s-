'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Nền chung của mọi trang (19/11/2026, theo yêu cầu "background nên thêm gì đó, thêm hiệu ứng chuyển màu ở tất cả trang").
 * - Ba mảng màu loang ở mép trang (không phủ cột chữ), đổi dần theo vị trí cuộn: đầu trang → giữa → cuối.
 *   Mỗi loại trang có bảng màu riêng (app/design/backdrop.css), lấy từ màu của site.
 * - Trang hồ sơ: màu đổi theo loại đoạn đang đọc (tư liệu, thực hành, truyền thống kể, giả thuyết, ghi chú).
 * - Hai dải sóng nước rất mảnh ở hai lề, trôi chậm hơn trang một chút; chỉ hiện khi lề đủ rộng.
 * Chỉ đổi opacity và transform (chạy trên compositor); cuộn do CSS scroll-timeline lo, JS chỉ đặt bảng màu
 * và theo dõi đoạn đang đọc bằng IntersectionObserver. Giảm chuyển động: màu đứng yên, đổi tức thì.
 */
const KIND_TONE: Record<string, string> = {
  documented_history: 'fact', explanation: 'fact',
  observed_practice: 'practice', community_memory: 'practice',
  folk_belief: 'lore', legend: 'lore', anecdote: 'lore',
  hypothesis: 'hypo', editorial_note: 'note',
};

function paletteFor(path: string) {
  const seg = path.split('/')[1] ?? '';
  if (!seg) return 'home';
  if (seg === 'ho-so') return 'dossier';
  if (seg === 'chuyen-muc' || seg === 'kham-pha' || seg === 'tim-kiem') return 'collection';
  if (seg === 'chuyen-de' || seg === 'tri-thuc' || seg === 'tu-dien' || seg === 'dong-thoi-gian' || seg === 'lien-ket-tri-thuc' || seg === 'vi-sao') return 'knowledge';
  if (seg === 'hanh-trinh') return 'journey';
  if (seg === 'ban-do') return 'map';
  if (seg === 'lich-le-hoi') return 'festival';
  return 'default';
}

export function Backdrop() {
  const path = usePathname() ?? '/';
  const ref = useRef<HTMLDivElement>(null);
  const palette = paletteFor(path);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    root.removeAttribute('data-tone');
    if (palette !== 'dossier' || !('IntersectionObserver' in window)) return;
    // Đoạn nào cắt ngang dải đọc (khoảng 40% chiều cao màn hình) thì lấy màu của đoạn đó.
    const sections = [...document.querySelectorAll<HTMLElement>('.nx-section[class*="kind-"]')];
    if (!sections.length) return;
    const toneOf = (el: Element) => {
      const k = [...el.classList].find(c => c.startsWith('kind-'))?.slice(5) ?? '';
      return KIND_TONE[k] ?? 'fact';
    };
    const io = new IntersectionObserver(entries => {
      for (const e of entries) if (e.isIntersecting) root.setAttribute('data-tone', toneOf(e.target));
    }, { rootMargin: '-40% 0px -59% 0px' });
    sections.forEach(s => io.observe(s));
    return () => io.disconnect();
  }, [path, palette]);

  return (
    <div className="bd" ref={ref} data-bd={palette} aria-hidden="true">
      <div className="bd-w w0" />
      <div className="bd-w w1" />
      <div className="bd-w w2" />
      {palette === 'dossier' && <>
        <div className="bd-k k-fact" />
        <div className="bd-k k-practice" />
        <div className="bd-k k-lore" />
        <div className="bd-k k-hypo" />
        <div className="bd-k k-note" />
      </>}
      <div className="bd-m is-left"><i /></div>
      <div className="bd-m is-right"><i /></div>
    </div>
  );
}
