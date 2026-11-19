'use client';
import { useEffect, type CSSProperties } from 'react';
import Image from 'next/image';
import { storyImages, type StoryImage } from '@/lib/story';

/**
 * Màn mở đầu của trang chủ, chỉ hiện lần đầu mỗi phiên.
 * Một đoạn clip chừng bảy giây dựng từ ảnh thật (19/11/2026): năm cảnh nối nhau bằng nhát cắt lướt ngang, mỗi cảnh
 * máy trôi chậm (đẩy, kéo, lia) như quay phim, có khung điện ảnh trên dưới. Thứ tự đi theo câu chuyện sáu chương:
 * sông Hậu nhìn từ vũ trụ (Nước) → chợ nổi Cái Răng (Bến sông) → nhà cổ Bình Thủy (Nếp nhà) → chùa Dơi (Mùa hội)
 * → rạch dừa nước Mỹ Tho, nơi tên “Nam Bộ Ký Sự” hiện ra như nét bút; rồi màn kéo lên để lộ cũng tấm ảnh ấy ở trang chủ.
 * Ảnh là ảnh chương đã có giấy phép (lib/story.ts), mỗi cảnh ghi công ở góc. Nhịp thời gian nằm trong scenes.css (mục 12).
 *
 * Bật hay không do một đoạn script nhỏ trong <head> quyết định trước khi trang vẽ (layout.tsx, INTRO_GATE):
 * chỉ ở trang chủ, chưa xem trong phiên này, không có #mục trên địa chỉ, không bật giảm chuyển động. `?intro=1` để xem lại.
 * Màn tự kéo lên bằng CSS (scenes.css), nên dù JS của React lỗi thì màn vẫn tự mất. JS ở đây chỉ để bỏ qua sớm:
 * bấm, chạm, cuộn hoặc nhấn phím bất kỳ.
 */
export const INTRO_GATE = "try{var d=document.documentElement,f=/[?&]intro=1(&|$)/.test(location.search);if(location.pathname==='/'&&(f||(!location.hash&&!sessionStorage.getItem('nbks-intro')&&!matchMedia('(prefers-reduced-motion: reduce)').matches))){d.classList.add('intro-on');sessionStorage.setItem('nbks-intro','1')}}catch(e){}";

const photo = storyImages.prologue;
/** Cảnh của clip: ảnh, nhãn chương, thời điểm bắt đầu (giây) và chuyển động máy (tỉ lệ, dịch ngang đầu → cuối). */
const SHOTS: { img: StoryImage; label: string; at: number; s: [number, number]; x: [string, string] }[] = [
  { img: storyImages.nuoc, label: 'Chương 1 · Nước', at: 0, s: [1.32, 1.08], x: ['0%', '0%'] },
  { img: storyImages.ben, label: 'Chương 3 · Bến sông', at: 1.25, s: [1.12, 1.12], x: ['3%', '-3%'] },
  { img: storyImages.nha, label: 'Chương 4 · Nếp nhà', at: 2.5, s: [1.2, 1.04], x: ['0%', '0%'] },
  { img: storyImages.hoi, label: 'Chương 5 · Mùa hội', at: 3.75, s: [1.1, 1.1], x: ['-3%', '3%'] },
  { img: photo, label: '', at: 5, s: [1.16, 1.02], x: ['0%', '0%'] },
];

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
      const k = Math.min(1, (now - t0 - 300) / 6000);
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
    // Phòng khi sự kiện kết thúc không tới (tab nền, trình duyệt bỏ animation): dọn sau 9,5 giây.
    const t = window.setTimeout(done, 9500);
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
      {SHOTS.map((sh, i) => (
        <div className={`intro-shot${i === SHOTS.length - 1 ? ' is-last' : ''}`} key={sh.img.url}
          style={{ '--at': `${sh.at}s`, '--s0': sh.s[0], '--s1': sh.s[1], '--x0': sh.x[0], '--x1': sh.x[1] } as CSSProperties}>
          <Image src={sh.img.url} alt="" fill sizes="100vw" quality={i === SHOTS.length - 1 ? 85 : 70} style={{ objectPosition: sh.img.position }} />
          {sh.label && <p className="intro-cap">{sh.label}</p>}
          <p className="intro-credit">Ảnh: {sh.img.author}, {sh.img.license_name}</p>
        </div>
      ))}
      <div className="intro-bars" />
      <div className="intro-sky" />
      <div className="intro-dawn" />
      <div className="intro-copy">
        <p className="intro-title"><span>Nam Bộ Ký Sự</span></p>
        <p className="intro-tag"><span>Một vùng đất</span><i>·</i><span>Ngàn câu chuyện</span><i>·</i><span>Muôn hành trình</span></p>
      </div>
      {total > 0 && <p className="intro-count"><b data-to={total}>0</b><small>hồ sơ đã kiểm chứng</small><i /></p>}
      <p className="intro-hint">Chạm hoặc nhấn phím để bỏ qua</p>
    </div>
  );
}
