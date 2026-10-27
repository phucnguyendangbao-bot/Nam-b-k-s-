'use client';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { rankEntries } from '@/lib/search-match';
import type { SearchEntry } from '@/lib/search-index';

const OPEN_EVENT = 'nb:open-search';
let cache: Promise<SearchEntry[]> | null = null;
function loadIndex() {
  cache ??= fetch('/api/search')
    .then(async r => { if (!r.ok) throw new Error(String(r.status)); return (await r.json()) as { entries: SearchEntry[] }; })
    .then(d => d.entries)
    .catch(err => { cache = null; throw err; });
  return cache;
}

const typeLabel: Record<SearchEntry['type'], string> = { article: 'Hồ sơ', word: 'Mục từ', tour: 'Hành trình', page: 'Trang' };
const suggestions = ['chợ nổi', 'Đầu Sấu', 'mần', 'đám giỗ', 'nhà cổ', 'bậu'];

/** Nút mở bảng tìm kiếm trên thanh đầu trang. */
export function SearchTrigger() {
  const mac = useSyncExternalStore(() => () => {}, () => /Mac|iPhone|iPad/.test(navigator.platform), () => false);
  return (
    <button type="button" className="nb-search-trigger" onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))} aria-label="Tìm nhanh" aria-keyshortcuts="Control+K Meta+K">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2.4" /><path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>
      <span className="nb-search-trigger-label">Tìm nhanh</span>
      <kbd>{mac ? '⌘' : 'Ctrl'} K</kbd>
    </button>
  );
}

/** Bảng tìm kiếm toàn trang, mở bằng Ctrl/⌘ + K hoặc phím /. */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [entries, setEntries] = useState<SearchEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  const show = useCallback(() => {
    lastFocus.current = document.activeElement as HTMLElement | null;
    setOpen(true);
    setFailed(false);
    loadIndex().then(setEntries).catch(() => setFailed(true));
  }, []);
  const hide = useCallback(() => {
    setOpen(false);
    setQuery('');
    setActive(0);
    lastFocus.current?.focus?.();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target.closest('input,textarea,select,[contenteditable=true]');
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); if (open) hide(); else show(); }
      else if (e.key === '/' && !typing && !open) { e.preventDefault(); show(); }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener(OPEN_EVENT, show);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener(OPEN_EVENT, show); };
  }, [open, show, hide]);

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const results = useMemo(() => {
    if (!entries) return [];
    if (!query.trim()) return entries.filter(e => e.type !== 'page').slice(0, 6);
    return rankEntries(entries, query, 24);
  }, [entries, query]);

  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!open) return null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); hide(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter' && results[active]) { e.preventDefault(); window.location.href = results[active].href; }
    else if (e.key === 'Tab') { e.preventDefault(); input.current?.focus(); }
  };

  return (
    <div className="nb-palette-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) hide(); }}>
      <div className="nb-palette" role="dialog" aria-modal="true" aria-label="Tìm nhanh" onKeyDown={onKeyDown}>
        <div className="nb-palette-input">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2.4" /><path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>
          <input
            ref={input}
            value={query}
            onChange={e => { setQuery(e.target.value); setActive(0); }}
            placeholder="Gõ tên đất, phong tục hoặc một từ… (có dấu hay không đều được)"
            role="combobox"
            aria-expanded="true"
            aria-controls="nb-palette-list"
            aria-activedescendant={results[active] ? `nb-palette-${active}` : undefined}
            aria-autocomplete="list"
            maxLength={120}
          />
          <button type="button" className="nb-palette-close" onClick={hide}>Esc</button>
        </div>
        {!query.trim() && (
          <div className="nb-palette-suggest">
            <span>Thử gõ</span>
            {suggestions.map(s => <button type="button" key={s} onClick={() => { setQuery(s); setActive(0); input.current?.focus(); }}>{s}</button>)}
          </div>
        )}
        <ul className="nb-palette-list" id="nb-palette-list" role="listbox" ref={list}>
          {failed && <li className="nb-palette-empty">Chưa tải được dữ liệu tìm kiếm. Kiểm tra kết nối rồi mở lại bảng tìm (Ctrl K).</li>}
          {!failed && !entries && <li className="nb-palette-empty">Đang tải…</li>}
          {entries && query.trim() && !results.length && <li className="nb-palette-empty">Chưa có hồ sơ nào khớp “{query}”. Thử từ khác, hoặc <a href={`/tim-kiem?q=${encodeURIComponent(query)}`}>mở trang tìm kiếm</a>.</li>}
          {results.map((r, i) => (
            <li key={r.href} id={`nb-palette-${i}`} data-index={i} role="option" aria-selected={i === active}>
              <a href={r.href} className={`tone-${r.tone} ${i === active ? 'is-active' : ''}`} onMouseMove={() => setActive(i)}>
                <span className="nb-palette-type">{typeLabel[r.type]}</span>
                <span className="nb-palette-text"><strong>{r.title}</strong><small>{r.subtitle}</small></span>
              </a>
            </li>
          ))}
        </ul>
        <div className="nb-palette-foot"><span><kbd>↑</kbd><kbd>↓</kbd> chọn</span><span><kbd>Enter</kbd> mở</span><span><kbd>Esc</kbd> đóng</span></div>
      </div>
    </div>
  );
}

/** Ô tìm kiếm hiện kết quả ngay khi gõ, dùng trên trang Khám phá/Tìm kiếm. */
export function InstantSearch({ initial = '', children }: { initial?: string; children?: React.ReactNode }) {
  const [query, setQuery] = useState(initial);
  const [entries, setEntries] = useState<SearchEntry[] | null>(null);
  useEffect(() => { loadIndex().then(setEntries).catch(() => setEntries([])); }, []);
  useEffect(() => {
    const url = new URL(window.location.href);
    if (query.trim()) url.searchParams.set('q', query); else url.searchParams.delete('q');
    window.history.replaceState(null, '', url);
  }, [query]);
  const results = useMemo(() => (entries ? rankEntries(entries.filter(e => e.type !== 'page'), query, 40) : []), [entries, query]);
  return (
    <div className="nb-instant">
      <form className="search-form nb-instant-form" role="search" action="/tim-kiem" onSubmit={e => e.preventDefault()}>
        <label className="sr-only" htmlFor="nb-instant-q">Tìm trong các hồ sơ đã công bố</label>
        <svg className="nb-search-glyph" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2.4" /><path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>
        <input id="nb-instant-q" name="q" value={query} onChange={e => setQuery(e.target.value)} placeholder="Gõ để tìm ngay: chợ nổi, mần, đám giỗ…" autoComplete="off" maxLength={120} />
        {query && <button type="button" className="nb-instant-clear" onClick={() => setQuery('')} aria-label="Xóa từ khóa">×</button>}
      </form>
      <div className="nb-instant-status" role="status" aria-live="polite">
        {query.trim() ? (entries ? `${results.length} kết quả cho “${query}”` : 'Đang tải…') : 'Kết quả hiện ngay khi bạn gõ. Không cần gõ dấu.'}
      </div>
      {query.trim() && entries && (
        results.length ? (
          <ul className="nb-instant-results">
            {results.map((r, i) => (
              <li key={r.href} style={{ '--i': i } as React.CSSProperties}>
                <a href={r.href} className={`tone-${r.tone}`}>
                  <span className="nb-palette-type">{typeLabel[r.type]}</span>
                  <span className="nb-palette-text"><strong>{r.title}</strong><small>{r.subtitle}</small></span>
                </a>
              </li>
            ))}
          </ul>
        ) : <p className="nb-instant-none">Chưa có hồ sơ nào khớp. Thử một từ khác, hoặc <a href="/ky-uc-cong-dong">gửi cho ban biên tập điều bạn biết</a>.</p>
      )}
      {!query.trim() && children}
    </div>
  );
}
