import { categories, classes, statusLabels } from '@/lib/catalog';
import { stats, type Row } from '@/lib/static-data';
import { SearchTrigger } from '@/components/interactive/command-palette';
import { SiteNav, type NavItem } from '@/components/interactive/site-nav';
import { knowledgeDomains } from '@/lib/knowledge-taxonomy';
import { Arrow, Motif, StoryCard, categoryTone } from './cards';
export { Arrow, EvidenceMix, Motif, StoryCard, categoryTone, evidenceMix, toneFor, collectionFor } from './cards';

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

const domain = (id: string, label?: string, href?: string) => {
  const d = knowledgeDomains.find(x => x.id === id)!;
  return { href: href ?? `/chuyen-de/${id}`, label: label ?? d.name, note: d.description };
};
const navItems: NavItem[] = [
  { href: '/kham-pha', label: 'Khám phá' },
  {
    label: 'Văn hóa',
    menu: [
      domain('phong-tuc-doi-song'), domain('tin-nguong-ton-giao'), domain('le-hoi'), domain('van-hoc-nghe-thuat'),
      domain('am-thuc'), domain('lang-nghe-sinh-ke'), domain('kien-truc-khong-gian-song'), domain('phuong-ngu-nam-bo', 'Phương ngữ Nam Bộ', '/tu-dien'),
    ],
    all: { href: '/tri-thuc', label: 'Kho tri thức: đủ 12 lĩnh vực' },
  },
  {
    label: 'Lịch sử',
    menu: [
      domain('lich-su-khao-co'), domain('dia-danh'), domain('nhan-vat-ky-uc'), domain('dia-ly-sinh-thai'),
      { href: '/dong-thoi-gian', label: 'Dòng thời gian tư liệu', note: 'Các mốc có nguồn, phân biệt ghi danh và sự kiện.' },
      { href: '/vi-sao-lai-the', label: 'Vì sao lại thế?', note: 'Lời giải thích và điều chưa rõ trong các hồ sơ.' },
    ],
  },
  { href: '/ban-do', label: 'Bản đồ' },
  { href: '/hanh-trinh', label: 'Hành trình' },
];
const aboutNav = [
  { href: '/ve-du-an', label: 'Về dự án' },
  { href: '/nguon-tu-lieu', label: 'Nguồn tư liệu' },
  { href: '/huong-dan-doc', label: 'Hướng dẫn đọc' },
  { href: '/ky-uc-cong-dong', label: 'Gửi ký ức' },
];

export function Header({ user }: { user: Row | null }) {
  const staff = user && ['admin', 'editor', 'researcher'].includes(user.role);
  return (
    <>
      <a href="#main" className="skip-link">Đến nội dung chính</a>
      <header className="sh">
        <div className="sh-inner">
          <a className="sh-brand" href="/" aria-label="Nam Bộ Ký Sự, về trang chủ">
            <Mark size={28} />
            <span className="sh-word">Nam Bộ <b>Ký Sự</b></span>
          </a>
          <SiteNav items={navItems} secondary={staff ? [...aboutNav, { href: '/quan-tri', label: 'Bàn biên tập' }] : aboutNav} />
          <div className="sh-tools">
            <SearchTrigger />
            {staff && <a className="sh-staff" href="/quan-tri">Bàn biên tập</a>}
          </div>
        </div>
      </header>
    </>
  );
}

const footerGroups: { title: string; links: [string, string][] }[] = [
  { title: 'Khám phá', links: categories.map(c => [`/chuyen-muc/${c.slug}`, c.name]) },
  { title: 'Tra cứu', links: [['/kham-pha', 'Tất cả hồ sơ'], ['/tri-thuc', 'Kho tri thức'], ['/tu-dien', 'Từ điển phương ngữ'], ['/dong-thoi-gian', 'Dòng thời gian'], ['/ban-do', 'Bản đồ di sản'], ['/hanh-trinh', 'Hành trình']] },
  { title: 'Dự án', links: [['/ve-du-an', 'Giới thiệu dự án'], ['/huong-dan-doc', 'Hướng dẫn đọc'], ['/ong-ba-ke-chuyen', 'Ông bà kể chuyện'], ['/ky-uc-cong-dong', 'Gửi ký ức']] },
  { title: 'Chính sách', links: [['/nguyen-tac-bien-tap', 'Nguyên tắc biên tập'], ['/quyen-su-dung', 'Sử dụng và ghi công'], ['/tinh-trang-tu-lieu', 'Tình trạng tư liệu']] },
];

export async function Footer({ user }: { user: Row | null }) {
  let n: { sources: number; published: number } | null = null;
  try { n = await stats(); } catch { /* chân trang vẫn hiển thị khi chưa đọc được số liệu */ }
  return (
    <footer className="sf">
      <div className="sf-inner">
        <div className="sf-brand">
          <a className="sh-brand" href="/" aria-label="Nam Bộ Ký Sự, về trang chủ"><Mark size={28} /><span className="sh-word">Nam Bộ <b>Ký Sự</b></span></a>
          <p>Kho hồ sơ văn hóa Nam Bộ, bắt đầu từ Cần Thơ, Hậu Giang và Sóc Trăng. Mỗi nhận định dẫn về nguồn để bạn tự đối chiếu.</p>
        </div>
        {footerGroups.map(g => (
          <nav className="sf-col" key={g.title} aria-label={g.title}>
            <h2>{g.title}</h2>
            <ul>{g.links.map(([href, label]) => <li key={href}><a href={href}>{label}</a></li>)}</ul>
          </nav>
        ))}
      </div>
      <div className="sf-method">
        <div>
          <h2>Phương pháp kiểm chứng</h2>
          <p>Mỗi đoạn trong hồ sơ được gắn nhãn loại thông tin và dẫn về nguồn. Hồ sơ chỉ công bố sau khi đối chiếu nguồn và duyệt quyền sử dụng ảnh. <a href="/huong-dan-doc">Cách đọc một hồ sơ</a></p>
        </div>
        <ul className="ev-key" aria-label="Các loại nhãn thông tin">
          <li><span className="epistemic-label kind-documented_history">Có tư liệu</span></li>
          <li><span className="epistemic-label kind-hypothesis">Giả thuyết</span></li>
          <li><span className="epistemic-label kind-folk_belief">Truyền thống kể</span></li>
          <li><span className="epistemic-label kind-editorial_note">Ghi chú biên tập</span></li>
        </ul>
      </div>
      <div className="sf-sources">
        <h2>Nguồn tư liệu và bản quyền</h2>
        <ul>
          <li><a href="/nguon-tu-lieu">{n ? `${n.sources} nguồn đăng ký` : 'Danh mục nguồn'}</a>: cơ quan chuyên môn, thư viện, báo chí, từ điển mở.</li>
          <li>Ảnh từ Wikimedia Commons, ghi tác giả và giấy phép tại từng ảnh.</li>
          <li>Bản đồ: dữ liệu © OpenStreetMap contributors; ảnh vệ tinh Esri World Imagery.</li>
          <li>Thuyết minh tour: giọng tổng hợp Piper VAIS-1000, CC BY 4.0. Phông Be Vietnam Pro và Noto Serif, giấy phép OFL.</li>
        </ul>
      </div>
      <div className="sf-bottom">
        <span>© 2026 Nam Bộ Ký Sự{n ? ` · ${n.published} hồ sơ đang hiển thị` : ''}</span>
        <span>{user ? `Đang xem: ${user.displayName}` : <a href="/quyen-su-dung">Điều kiện sử dụng và ghi công</a>}</span>
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
