'use client';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { SpringValue, VelocityTracker, prefersReducedMotion, project, rubberband, springs } from '@/lib/spring';

export type NavLink = { href: string; label: string; note?: string };

const isCurrent = (path: string, href: string) => (href === '/' ? path === '/' : path === href || path.startsWith(href + '/'));

/** Đóng khi bấm ra ngoài hoặc nhấn Esc, trả focus về nút mở. */
function useDismiss(open: boolean, close: () => void, root: React.RefObject<HTMLElement | null>, trigger: React.RefObject<HTMLButtonElement | null>) {
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (root.current && !root.current.contains(e.target as Node)) close(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { close(); trigger.current?.focus(); } };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open, close, root, trigger]);
}

/**
 * Tấm menu trên điện thoại: trượt vào từ cạnh phải và đi ra đúng đường đó; kéo sang phải để đóng,
 * có quán tính; kéo quá mép trái thì cản dần. Có lớp mờ phía sau vì đây là thao tác chặn (modal).
 */
function Sheet({ open, onClose, id, children }: { open: boolean; onClose: () => void; id: string; children: React.ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  const scrim = useRef<HTMLDivElement>(null);
  const x = useRef<SpringValue | null>(null);
  const [present, setPresent] = useState(open);
  const drag = useRef<{ id: number; sx: number; sy: number; origin: number; locked: 'x' | 'y' | null } | null>(null);
  const tracker = useRef(new VelocityTracker());
  const suppress = useRef(false);
  const width = () => panel.current?.offsetWidth ?? 360;

  if (open && !present) setPresent(true);

  const apply = useCallback((v: number) => {
    const w = width();
    if (panel.current) panel.current.style.transform = `translate3d(${v}px,0,0)`;
    if (scrim.current) scrim.current.style.opacity = String(Math.max(0, Math.min(1, 1 - v / w)));
  }, []);

  useEffect(() => {
    if (!present) return;
    if (!x.current) { x.current = new SpringValue(width(), apply); apply(width()); }
    const s = x.current;
    if (prefersReducedMotion()) {
      // Giảm chuyển động: không trượt, chỉ hiện mờ dần.
      s.set(0);
      panel.current?.setAttribute('data-state', open ? 'open' : 'closed');
      if (!open) { const t = window.setTimeout(() => { x.current = null; setPresent(false); }, 200); return () => window.clearTimeout(t); }
      return;
    }
    // Luôn chạy từ vị trí đang hiển thị, nên mở lại giữa lúc đang đóng vẫn liền mạch.
    if (open) s.to(0, springs.sheet);
    else s.to(width(), { ...springs.ui, onRest: () => { x.current = null; setPresent(false); } });
  }, [open, present, apply]);

  useEffect(() => {
    if (!open || !present) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.querySelector<HTMLElement>('a, button')?.focus({ preventScroll: true });
    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !panel.current) return;
      const items = [...panel.current.querySelectorAll<HTMLElement>('a, button')];
      if (!items.length) return;
      if (e.shiftKey && document.activeElement === items[0]) { e.preventDefault(); items[items.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === items[items.length - 1]) { e.preventDefault(); items[0].focus(); }
    };
    document.addEventListener('keydown', trap);
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', trap); };
  }, [open, present]);

  if (!present || typeof document === 'undefined') return null;
  return createPortal(
    <div className="sheet-layer">
      <div className="sheet-scrim" ref={scrim} onClick={onClose} aria-hidden="true" />
      <div
        className="sheet" id={id} ref={panel} role="dialog" aria-modal="true" aria-label="Menu" data-state={open ? 'open' : 'closed'}
        onPointerDown={e => {
          if (e.button !== 0) return;
          x.current?.stop();
          drag.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, origin: x.current?.value ?? 0, locked: null };
          tracker.current.reset();
        }}
        onPointerMove={e => {
          const d = drag.current;
          if (!d || d.id !== e.pointerId) return;
          const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
          if (!d.locked) {
            if (Math.hypot(dx, dy) < 10) return;
            d.locked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
            if (d.locked === 'y') { drag.current = null; return; }
            panel.current?.setPointerCapture(e.pointerId);
          }
          const raw = d.origin + dx;
          const v = raw < 0 ? rubberband(raw, width()) : raw;
          x.current?.set(v);
          tracker.current.add(v);
        }}
        onPointerUp={e => {
          const d = drag.current;
          drag.current = null;
          if (!d || d.id !== e.pointerId || d.locked !== 'x') return;
          suppress.current = true;
          window.setTimeout(() => { suppress.current = false; }, 350);
          const v = tracker.current.velocity();
          const pos = x.current?.value ?? 0;
          if (pos + project(v) > width() / 2 && v > -50) { x.current?.to(width(), { ...springs.ui, velocity: v }); onClose(); }
          else x.current?.to(0, { ...springs.sheet, velocity: v });
        }}
        onPointerCancel={() => { drag.current = null; x.current?.to(0, springs.sheet); }}
        onDragStart={e => e.preventDefault()}
        onClickCapture={e => { if (suppress.current) { suppress.current = false; e.preventDefault(); e.stopPropagation(); } }}
      >
        <div className="sheet-grip" aria-hidden="true" />
        <button type="button" className="sheet-close" onClick={onClose}>Đóng</button>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export type NavMenu = { label: string; menu: NavLink[]; all?: NavLink };
export type NavItem = NavLink | NavMenu;
const isMenu = (x: NavItem): x is NavMenu => 'menu' in x;

/** Một ngăn thả xuống: mở ra từ chính nút bấm, chỉ một ngăn mở tại một thời điểm. */
function MenuItem({ item, path, open, onToggle, onClose }: { item: NavMenu; path: string; open: boolean; onToggle: () => void; onClose: () => void }) {
  const root = useRef<HTMLLIElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const id = useId();
  useDismiss(open, onClose, root, btn);
  const current = item.menu.some(c => isCurrent(path, c.href));
  return (
    <li className="sn-has-menu" ref={root}>
      <button ref={btn} type="button" aria-expanded={open} aria-controls={id} onClick={onToggle} className={current ? 'is-current' : undefined}>
        {item.label}
        <svg width="10" height="7" viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1.5 6 6.5l5-5" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
      </button>
      <div className="sn-menu material" id={id} data-state={open ? 'open' : 'closed'} inert={!open}>
        <ul>
          {item.menu.map(c => (
            <li key={c.href}>
              <a href={c.href} aria-current={isCurrent(path, c.href) ? 'page' : undefined}>
                <strong>{c.label}</strong>
                {c.note && <small>{c.note}</small>}
              </a>
            </li>
          ))}
        </ul>
        {item.all && <a className="sn-menu-all" href={item.all.href}>{item.all.label} <span aria-hidden="true">→</span></a>}
      </div>
    </li>
  );
}

/** Điều hướng chính: liên kết trực tiếp, ngăn thả xuống khi thật cần, và tấm menu trên điện thoại. */
export function SiteNav({ items, secondary }: { items: NavItem[]; secondary: NavLink[] }) {
  const path = usePathname() ?? '/';
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(false);
  const drawerBtn = useRef<HTMLButtonElement>(null);
  const drawerId = useId();
  const closeMenu = useCallback(() => setOpenMenu(null), []);
  const closeDrawer = useCallback(() => { setDrawer(false); drawerBtn.current?.focus({ preventScroll: true }); }, []);
  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDrawer(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawer, closeDrawer]);

  // Mép cuộn: thanh đầu trang chỉ hiện nền mờ và lớp chuyển tiếp khi nội dung thực sự trượt bên dưới.
  useEffect(() => {
    const header = document.querySelector<HTMLElement>('.sh');
    if (!header) return;
    const onScroll = () => { header.dataset.scrolled = window.scrollY > 8 ? 'true' : 'false'; };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <nav className="sn" aria-label="Điều hướng chính">
        <ul className="sn-list">
          {items.map(item => isMenu(item)
            ? <MenuItem key={item.label} item={item} path={path} open={openMenu === item.label} onToggle={() => setOpenMenu(m => (m === item.label ? null : item.label))} onClose={closeMenu} />
            : <li key={item.href}><a href={item.href} aria-current={isCurrent(path, item.href) ? 'page' : undefined}>{item.label}</a></li>)}
        </ul>
      </nav>

      <div className="sn-mobile">
        <button ref={drawerBtn} type="button" className="sn-burger" aria-expanded={drawer} aria-controls={drawerId} onClick={() => setDrawer(d => !d)}>
          <span className="sr-only">{drawer ? 'Đóng menu' : 'Mở menu'}</span>
          <span aria-hidden="true" /><span aria-hidden="true" />
        </button>
        <Sheet open={drawer} onClose={closeDrawer} id={drawerId}>
          <nav aria-label="Điều hướng trên điện thoại">
            <ul className="sn-drawer-main">
              {items.filter((x): x is NavLink => !isMenu(x)).map(l => <li key={l.href}><a href={l.href} aria-current={isCurrent(path, l.href) ? 'page' : undefined}>{l.label}</a></li>)}
            </ul>
            {items.filter(isMenu).map(m => (
              <div key={m.label}>
                <p className="sn-drawer-label">{m.label}</p>
                <ul className="sn-drawer-grid">
                  {m.menu.map(c => <li key={c.href}><a href={c.href} aria-current={isCurrent(path, c.href) ? 'page' : undefined}>{c.label}</a></li>)}
                </ul>
              </div>
            ))}
            <p className="sn-drawer-label">Về dự án</p>
            <ul className="sn-drawer-small">
              {secondary.map(l => <li key={l.href}><a href={l.href}>{l.label}</a></li>)}
            </ul>
          </nav>
        </Sheet>
      </div>
    </>
  );
}
