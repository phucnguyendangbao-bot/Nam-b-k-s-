'use client';
import { useEffect } from 'react';
import Image from 'next/image';
import { storyImages } from '@/lib/story';

/**
 * Màn mở đầu của trang chủ, chỉ hiện lần đầu mỗi phiên.
 * Một đoạn chừng ba giây trên ảnh thật (19/11/2026, thay cảnh vẽ): chính ảnh mở đầu của trang chủ, rạch dừa nước ở Mỹ Tho,
 * phủ tối như lúc rạng đông rồi từ từ thu về; tên “Nam Bộ Ký Sự” hiện ra như nét bút đang viết; rồi màn kéo lên để lộ
 * cũng tấm ảnh ấy ở trang chủ, từ màu cũ hiện dần ra màu thật. Dùng cùng tệp và cùng cỡ với ảnh mở đầu nên không tải thêm.
 *
 * Bật hay không do một đoạn script nhỏ trong <head> quyết định trước khi trang vẽ (layout.tsx, INTRO_GATE):
 * chỉ ở trang chủ, chưa xem trong phiên này, không có #mục trên địa chỉ, không bật giảm chuyển động. `?intro=1` để xem lại.
 * Màn tự kéo lên bằng CSS (scenes.css), nên dù JS của React lỗi thì màn vẫn tự mất. JS ở đây chỉ để bỏ qua sớm:
 * bấm, chạm, cuộn hoặc nhấn phím bất kỳ.
 */
export const INTRO_GATE = "try{var d=document.documentElement,f=/[?&]intro=1(&|$)/.test(location.search);if(location.pathname==='/'&&(f||(!location.hash&&!sessionStorage.getItem('nbks-intro')&&!matchMedia('(prefers-reduced-motion: reduce)').matches))){d.classList.add('intro-on');sessionStorage.setItem('nbks-intro','1')}}catch(e){}";

const photo = storyImages.prologue;

export function Intro({ total = 0 }: { total?: number }) {
  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains('intro-on')) return;
    const el = document.querySelector<HTMLElement>('.intro');
    if (!el) return;
    // Số hồ sơ đếm từ 0 lên trong lúc màn chạy (như màn tải của Tinkeroll, The Aviator).
    const num = el.querySelector<HTMLElement>('.intro-count b');
    const target = Number(num?.dataset.to ?? 0);
    const t0 = performance.now();
    let cRaf = 0;
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0 - 300) / 2500);
      if (num) num.textContent = String(Math.round(target * (k < 0 ? 0 : 1 - Math.pow(1 - k, 3))));
      if (k < 1) cRaf = requestAnimationFrame(tick);
    };
    cRaf = requestAnimationFrame(tick);
    let lifting = false;
    const done = () => { root.classList.add('intro-done'); off(); };
    const skip = () => {
      if (lifting) return;
      lifting = true;
      root.classList.add('intro-skip');
    };
    const onKey = (e: KeyboardEvent) => { if (!e.metaKey && !e.ctrlKey && !e.altKey) skip(); };
    const onAnimStart = (e: AnimationEvent) => { if (e.target === el && e.animationName.startsWith('intro-lift')) lifting = true; };
    const onAnimEnd = (e: AnimationEvent) => { if (e.target === el && e.animationName.startsWith('intro-lift')) done(); };
    const opts = { passive: true } as const;
    window.addEventListener('pointerdown', skip, opts);
    window.addEventListener('wheel', skip, opts);
    window.addEventListener('touchmove', skip, opts);
    window.addEventListener('keydown', onKey);
    el.addEventListener('animationstart', onAnimStart);
    el.addEventListener('animationend', onAnimEnd);
    // Phòng khi sự kiện kết thúc không tới (tab nền, trình duyệt bỏ animation): dọn sau 6 giây.
    const t = window.setTimeout(done, 6000);
    function off() {
      window.removeEventListener('pointerdown', skip);
      window.removeEventListener('wheel', skip);
      window.removeEventListener('touchmove', skip);
      window.removeEventListener('keydown', onKey);
      el!.removeEventListener('animationstart', onAnimStart);
      el!.removeEventListener('animationend', onAnimEnd);
      window.clearTimeout(t);
      if (cRaf) cancelAnimationFrame(cRaf);
    }
    return off;
  }, []);

  return (
    <div className="intro" aria-hidden="true">
      <div className="intro-photo">
        <Image src={photo.url} alt="" fill sizes="100vw" quality={85} style={{ objectPosition: photo.position }} />
      </div>
      <div className="intro-sky" />
      <div className="intro-dawn" />
      <div className="intro-copy">
        <p className="intro-title"><span>Nam Bộ Ký Sự</span></p>
        <p className="intro-tag"><span>Một vùng đất</span><i>·</i><span>Ngàn câu chuyện</span><i>·</i><span>Muôn hành trình</span></p>
      </div>
      {total > 0 && <p className="intro-count"><b data-to={total}>0</b><small>hồ sơ đã kiểm chứng</small><i /></p>}
      <p className="intro-hint">Chạm hoặc nhấn phím để bỏ qua<small>Ảnh: {photo.author}, {photo.license_name}</small></p>
    </div>
  );
}
