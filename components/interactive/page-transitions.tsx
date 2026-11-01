'use client';
import { useEffect } from 'react';

const NAME = 'hero-media';
type VT = { ready: Promise<void>; finished: Promise<void>; updateCallbackDone?: Promise<void>; skipTransition: () => void };
type SwapEvent = Event & { viewTransition: VT | null; activation: { entry: { url: string }; navigationType?: string } | null };
type RevealEvent = Event & { viewTransition: { finished: Promise<void> } | null };

/**
 * Chuyển trang giữa các trang (View Transitions giữa hai tài liệu, chỉ cần CSS ở motion.css).
 * Phần JS duy nhất: khi người đọc bấm một thẻ có ảnh để mở hồ sơ, gắn tên `hero-media` cho đúng ảnh đó ngay
 * trước khi rời trang, để ảnh bay về chỗ ảnh bìa của hồ sơ. Trình duyệt chưa hỗ trợ thì bỏ qua, trang vẫn mở bình thường.
 */
export function PageTransitions() {
  useEffect(() => {
    if (!('onpageswap' in window)) return;
    let last: HTMLAnchorElement | null = null;
    const onClick = (e: MouseEvent) => { last = (e.target as Element | null)?.closest?.('a[href]') ?? null; };
    const clear = () => document.querySelectorAll<HTMLElement>('[data-vt-named]').forEach(el => { el.style.viewTransitionName = ''; el.removeAttribute('data-vt-named'); });
    const onSwap = (e: Event) => {
      const { viewTransition, activation } = e as SwapEvent;
      const link = last; last = null;
      if (viewTransition) {
        // Trang đích có thể không nhận chuyển cảnh: bỏ qua lặng lẽ, không để lỗi lọt ra console.
        const quiet = () => {};
        viewTransition.ready.catch(quiet); viewTransition.finished.catch(quiet); viewTransition.updateCallbackDone?.catch(quiet);
        // Back/Forward mở lại trang từ bộ nhớ đệm, trình duyệt thường không chạy chuyển cảnh: bỏ luôn cho gọn.
        if (activation?.navigationType === 'traverse') { viewTransition.skipTransition(); return; }
      }
      if (!viewTransition || !activation || !link) return;
      const to = new URL(activation.entry.url, location.href);
      if (to.href !== link.href || !to.pathname.startsWith('/ho-so/')) return;
      const scope = link.closest('article, .bento-cell, .nb-story-card, li');
      const img = link.querySelector('img') ?? scope?.querySelector('img');
      if (!img) return;
      const r = img.getBoundingClientRect();
      if (r.width < 80 || r.bottom < 0 || r.top > innerHeight) return; // ảnh quá nhỏ hoặc ngoài khung nhìn thì chỉ chuyển mờ
      clear();
      // Trang đang mở cũng là hồ sơ: tạm gỡ tên khỏi ảnh bìa hiện tại để không trùng tên.
      document.querySelectorAll<HTMLElement>('.nb-dossier-cover img').forEach(el => { el.style.viewTransitionName = 'none'; el.setAttribute('data-vt-named', ''); });
      img.style.viewTransitionName = NAME;
      img.setAttribute('data-vt-named', '');
    };
    // Quay lại trang cũ từ bộ nhớ đệm: gỡ tên đã gắn sau khi chuyển cảnh xong, tránh trùng tên lần bấm sau.
    const onReveal = (e: Event) => { const vt = (e as RevealEvent).viewTransition; if (vt) vt.finished.then(clear, clear); else clear(); };
    document.addEventListener('click', onClick, true);
    window.addEventListener('pageswap', onSwap);
    window.addEventListener('pagereveal', onReveal);
    return () => { document.removeEventListener('click', onClick, true); window.removeEventListener('pageswap', onSwap); window.removeEventListener('pagereveal', onReveal); };
  }, []);
  return null;
}
