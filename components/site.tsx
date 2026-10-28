import { categories, classes, statusLabels } from '@/lib/catalog';
import type { Row } from '@/lib/static-data';
import { SearchTrigger } from '@/components/interactive/command-palette';
import { Arrow, Motif, StoryCard, categoryTone } from './cards';
export { Arrow, Motif, StoryCard, categoryTone, toneFor, collectionFor } from './cards';

/** Biểu tượng: mặt trời trên sông, nét vàng đồng trên nền nâu phù sa. */
export function Mark({ size = 44 }: { size?: number }) {
  return (
    <svg className="nb-mark" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="21" r="8.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M24 6v3M9 21h3M36 21h3M13.5 10.5l2 2M34.5 10.5l-2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 33c4-3 7 3 11 0s7-3 11 0 7 3 11 0 4-2 3-1M6 39c4-3 7 3 11 0s7-3 11 0 7 3 11 0 4-2 3-1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Hình vẽ nét nhà cổ Nam Bộ bên bến sông, dùng làm minh họa trang trí (không phải tư liệu). */
/** Hoa văn ngăn cách: hai nét mảnh và một con sóng nhỏ ở giữa. */
export function Ornament() {
  return (
    <svg className="hs-ornament" viewBox="0 0 160 16" aria-hidden="true">
      <path d="M0 8h58M102 8h58" stroke="currentColor" strokeWidth="1" />
      <path d="M62 8c3-4 6-4 9 0s6 4 9 0 6-4 9 0 6 4 9 0" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="58" cy="8" r="1.6" fill="currentColor" /><circle cx="102" cy="8" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function LineArt() {
  const bays = [40, 88, 136, 184, 232];
  return (
    <svg className="hs-lineart" viewBox="0 0 320 420" role="img" aria-label="Hình vẽ minh họa nhà cổ bên sông, không phải ảnh tư liệu">
      <g fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="252" cy="68" r="22" />
        <circle cx="252" cy="68" r="32" strokeDasharray="2 7" />
        <path d="M22 330C34 260 26 210 46 124" />
        <path d="M46 124c-22-6-40 4-48 16 18-6 32-8 48-16Zm0 0c-6-22-24-30-38-30 14 10 26 18 38 30Zm0 0c10-20 30-26 46-24-16 6-30 12-46 24Zm0 0c22-4 38 8 44 22-16-10-28-16-44-22Zm0 0c4 18-4 34-14 42 4-14 8-28 14-42Z" />
        <path d="M120 150l15-22h50l15 22M135 128c-4-6-2-10 2-12M185 128c4-6 2-10-2-12" />
        <path d="M30 200l30-50h200l30 50Z" />
        <path d="M60 150c-8-6-8-14-2-18M260 150c8-6 8-14 2-18" />
        <path d="M51 165h218M43 178h234M36 191h248" strokeDasharray="1 5" />
        <path d="M40 200h240v130H40ZM40 214h240" />
        {bays.map(x => <path key={x} d={`M${x + 10} 330v-70a14 14 0 0 1 28 0v70M${x + 24} 246v84M${x} 214v116`} />)}
        <path d="M280 214v116M30 338h260M20 346h280" />
        <path d="M0 368c20-6 40 6 60 0s40-6 60 0 40 6 60 0 40-6 60 0 40 6 60 0 20-4 20-2M0 384c20-6 40 6 60 0s40-6 60 0 40 6 60 0 40-6 60 0 40 6 60 0M0 400c20-6 40 6 60 0s40-6 60 0 40 6 60 0 40-6 60 0 40 6 60 0" />
        <path d="M112 362h100l-14 13h-72ZM132 362v-13h40v13M128 349l24-10 24 10M206 362l18-30" />
      </g>
    </svg>
  );
}

const navLeft = [
  { href: '/kham-pha', label: 'Khám phá' },
  { href: '/chuyen-muc/dat-nam-bo', label: 'Đất Nam Bộ' },
  { href: '/chuyen-muc/nep-xua', label: 'Nếp xưa' },
  { href: '/chuyen-muc/tieng-que-minh', label: 'Tiếng quê' },
];
const navRight = [
  { href: '/hanh-trinh', label: 'Hành trình' },
  { href: '/ban-do', label: 'Bản đồ' },
  { href: '/ky-uc-cong-dong', label: 'Gửi ký ức' },
  { href: '/so-tay', label: 'Sổ tay' },
];

export function Header({ user }: { user: Row | null }) {
  const staff = user && ['admin', 'editor', 'researcher'].includes(user.role);
  return (
    <>
      <a href="#main" className="skip-link">Đến nội dung chính</a>
      <div className="hs-topbar">
        <div className="hs-topbar-inner">
          <div className="hs-topbar-left">
            <SearchTrigger />
            <a href="/nguon-tu-lieu">Nguồn tư liệu</a>
            <a href="/hoi-dap">Tra cứu</a>
          </div>
          <div className="hs-topbar-right">
            <a href="/ve-du-an">Về dự án</a>
            {staff && <a href="/quan-tri">Bàn biên tập</a>}
            {user ? <span>Đang xem: {user.displayName}</span> : <span>Bản đọc công khai</span>}
          </div>
        </div>
      </div>
      <header className="nb-header">
        <div className="nb-header-inner">
          <nav className="hs-nav hs-nav-left" aria-label="Điều hướng chính">
            <a href="/" className="hs-home" aria-label="Trang chủ"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11 12 3l9 8v10h-6v-6H9v6H3Z" fill="currentColor" /></svg></a>
            {navLeft.map(n => <a key={n.href} href={n.href}>{n.label}</a>)}
          </nav>
          <a className="hs-emblem" href="/" aria-label="Nam Bộ Ký Sự — Trang chủ">
            <Mark size={46} />
            <span>Nam Bộ<b>Ký Sự</b></span>
          </a>
          <nav className="hs-nav hs-nav-right" aria-label="Điều hướng phụ">
            {navRight.map(n => <a key={n.href} href={n.href}>{n.label}</a>)}
          </nav>
          <details className="nb-mobile-menu">
            <summary aria-label="Mở menu"><span /><span /><span /></summary>
            <nav aria-label="Điều hướng trên điện thoại">
              <a href="/">Trang chủ</a>
              {[...navLeft, ...navRight].map(n => <a key={n.href} href={n.href}>{n.label}</a>)}
              <a href="/nguon-tu-lieu">Nguồn tư liệu</a>
              {staff && <a href="/quan-tri">Bàn biên tập</a>}
            </nav>
          </details>
        </div>
      </header>
    </>
  );
}

export function Footer({ user }: { user: Row | null }) {
  return (
    <footer className="hs-footer">
      <div className="hs-footer-inner">
        <div className="hs-footer-about">
          <h2>Nam Bộ Ký Sự</h2>
          <p>Kho hồ sơ văn hóa về đất, nếp sống và tiếng nói miền Tây sông nước, khởi đầu từ Cần Thơ, Hậu Giang và Sóc Trăng.</p>
          <ul>
            <li>Mỗi hồ sơ ghi rõ nguồn và vị trí đối chiếu trong tài liệu.</li>
            <li>Giả thuyết, lời kể và dữ kiện được gắn nhãn riêng.</li>
            <li>Ảnh và văn bản chỉ được đăng khi giấy phép cho phép.</li>
          </ul>
        </div>
        <nav className="hs-footer-links" aria-label="Liên kết chân trang">
          <a href="/kham-pha">Khám phá</a>
          <a href="/hanh-trinh">Hành trình</a>
          <a href="/ban-do">Bản đồ</a>
          <a href="/nguon-tu-lieu">Nguồn tư liệu</a>
          <a href="/hoi-dap">Tra cứu</a>
          <a href="/ky-uc-cong-dong">Gửi ký ức</a>
          <a href="/ve-du-an">Về dự án</a>
          <a href="/huong-dan-doc">Hướng dẫn đọc</a>
          <a href="/nguyen-tac-bien-tap">Nguyên tắc biên tập</a>
          <a href="/quyen-su-dung">Sử dụng &amp; ghi công</a>
          <a href="/tinh-trang-tu-lieu">Tình trạng tư liệu</a>
          <a href="/quan-tri">Nghiên cứu &amp; biên tập</a>
        </nav>
        <div className="hs-footer-mark">
          <Mark size={64} />
          <span>Nam Bộ<b>Ký Sự</b></span>
        </div>
      </div>
      <div className="hs-footer-bottom">
        <span>© 2026 Nam Bộ Ký Sự. Ảnh từ Wikimedia Commons theo giấy phép ghi tại từng ảnh. Bản đồ © OpenStreetMap contributors.</span>
        {user ? <span>Đang xem: {user.displayName}</span> : <span>Mỗi hồ sơ có nguồn để bạn tự đối chiếu</span>}
      </div>
    </footer>
  );
}

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="breadcrumb" aria-label="Đường dẫn">
      <a href="/">Trang chủ</a>
      {items.map((i, index) => <span key={index}><b aria-hidden="true">/</b>{i.href ? <a href={i.href}>{i.label}</a> : i.label}</span>)}
    </nav>
  );
}

export function PageTitle({ eyebrow, title, description, children }: { eyebrow?: string; title: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className="page-title">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
      {description && <p>{description}</p>}
      {children}
    </div>
  );
}

export function Empty({ title = 'Chưa có hồ sơ ở đây', description = 'Hồ sơ xuất hiện sau khi được kiểm chứng nguồn, duyệt quyền sử dụng và công bố.', action = '/kham-pha', label = 'Xem các hồ sơ đã có' }: { title?: string; description?: string; action?: string; label?: string }) {
  return (
    <div className="empty-state">
      <span className="empty-mark"><Motif kind="book" /></span>
      <h2>{title}</h2>
      <p>{description}</p>
      <a className="button outline" href={action}>{label}</a>
    </div>
  );
}

export function Flash({ params }: { params: Record<string, string | undefined> }) {
  return <>{params.done && <p className="notice success" role="status">{params.done}</p>}{params.error && <p className="notice error" role="alert">{params.error}</p>}</>;
}

export function SearchForm({ q = '', action = '/tim-kiem', placeholder = 'Tìm tên đất, phong tục, một từ địa phương…' }: { q?: string; action?: string; placeholder?: string }) {
  return (
    <form className="search-form" action={action} role="search">
      <label className="sr-only" htmlFor="search-q">Từ khóa tìm kiếm</label>
      <SearchGlyph />
      <input id="search-q" name="q" defaultValue={q} placeholder={placeholder} maxLength={160} />
      <button type="submit" aria-label="Tìm kiếm"><Arrow /></button>
    </form>
  );
}

export function SearchGlyph() {
  return <svg className="nb-search-glyph" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2.2" /><path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>;
}

export function CategoryCards({ counts = {} }: { counts?: Record<string, number> }) {
  return (
    <div className="nb-category-row">
      {categories.map(c => {
        const n = counts[c.slug] ?? 0;
        return (
          <a key={c.slug} className={`nb-category-chip tone-${categoryTone[c.slug]} ${n ? '' : 'is-soon'}`} href={`/chuyen-muc/${c.slug}`}>
            <Motif kind={c.motif} />
            <span><strong>{c.name}</strong><small>{n ? `${n} hồ sơ` : 'Đang biên soạn'}</small></span>
          </a>
        );
      })}
    </div>
  );
}

export function ContentCards({ items }: { items: Row[] }) {
  return (
    <div className="nb-card-grid">
      {items.map(c => <StoryCard key={c.id} item={c} />)}
    </div>
  );
}

export function Status({ status }: { status: string }) {
  return <span className={`status status-${status}`}>{statusLabels[status] ?? status}</span>;
}
export function Classification({ value }: { value: string }) {
  return <span className="classification">{classes[value] ?? value}</span>;
}
export function ActionForm({ action, id, back, children, className }: { action: string; id?: string; back?: string; children: React.ReactNode; className?: string }) {
  return (
    <form method="post" action="/api/action" className={className ?? 'stack-form'}>
      <input type="hidden" name="action" value={action} />
      {id && <input type="hidden" name="id" value={id} />}
      <input type="hidden" name="return_to" value={back ?? '/quan-tri'} />
      {children}
    </form>
  );
}
export function SignIn({ returnTo = '/so-tay' }: { returnTo?: string }) {
  const editorial = returnTo.startsWith('/quan-tri');
  return (
    <div className="signin-panel">
      <h2>{editorial ? 'Không gian biên tập chưa mở công khai.' : 'Giữ lại mạch đọc của bạn.'}</h2>
      <p>{editorial ? 'Bạn có thể đọc các hồ sơ đã được đối chiếu và xem nguồn dẫn. Khu vực sửa bài dành riêng cho quá trình biên tập.' : 'Sổ tay tài khoản và gửi tư liệu hiện chưa mở. Bạn có thể đánh dấu trang bằng tính năng của trình duyệt, sao chép liên kết hồ sơ hoặc đọc tiếp theo các hành trình.'}</p>
      <a className="button" href="/kham-pha">Xem các hồ sơ đã kiểm chứng <Arrow /></a>
    </div>
  );
}
