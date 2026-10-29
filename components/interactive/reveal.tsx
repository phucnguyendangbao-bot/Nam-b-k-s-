'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Hiện các khối `[data-reveal]` nhẹ nhàng khi cuộn tới.
 * Thứ tự quan trọng: đánh dấu ngay mọi khối đang nằm trong khung nhìn, rồi mới bật lớp `reveal-ready`,
 * cả hai trong cùng một nhịp nên nội dung đầu trang không bao giờ chớp ẩn. Không JS thì không ẩn gì.
 */
export function RevealObserver() {
  const path = usePathname();
  useEffect(() => {
    const root = document.documentElement;
    const els = [...document.querySelectorAll<HTMLElement>('[data-reveal]:not([data-revealed])')];
    if (!('IntersectionObserver' in window)) { els.forEach(el => el.setAttribute('data-revealed', '')); return; }
    const vh = window.innerHeight;
    for (const el of els) if (el.getBoundingClientRect().top < vh * 0.92) el.setAttribute('data-revealed', '');
    root.classList.add('reveal-ready');
    const io = new IntersectionObserver(entries => {
      for (const e of entries) if (e.isIntersecting) { e.target.setAttribute('data-revealed', ''); io.unobserve(e.target); }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(el => { if (!el.hasAttribute('data-revealed')) io.observe(el); });
    return () => io.disconnect();
  }, [path]);
  return null;
}
