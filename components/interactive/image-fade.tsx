'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Ảnh trong khung `.ph` hiện dần khi đã tải xong, thay vì bật ra từng mảng.
 * Ảnh đã có sẵn (bộ nhớ đệm) được đánh dấu ngay, rồi mới bật lớp `ph-ready`, nên không bao giờ chớp ẩn.
 * Không JS thì không ẩn gì; ảnh lỗi cũng được đánh dấu để chữ thay thế vẫn hiện.
 */
export function ImageFade() {
  const path = usePathname();
  useEffect(() => {
    const mark = (img: HTMLImageElement) => img.setAttribute('data-loaded', '');
    for (const img of document.querySelectorAll<HTMLImageElement>('.ph img:not([data-loaded])')) {
      if (img.complete) { mark(img); continue; }
      img.addEventListener('load', () => mark(img), { once: true });
      img.addEventListener('error', () => mark(img), { once: true });
    }
    document.documentElement.classList.add('ph-ready');
  }, [path]);
  return null;
}
