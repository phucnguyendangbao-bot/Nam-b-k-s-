import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Admin } from '@/components/admin';
import { ActionForm, Arrow, Breadcrumb, ContentCards, Empty, Flash, PageTitle, SearchForm, SignIn, Status } from '@/components/site';
import { all, content, ensureSeed, one, publicContents, publicTours, stats, tourStops, viewer, type Row } from '@/lib/static-data';
import { categories, fold } from '@/lib/catalog';
import { CollectionPage, PublicDossier, collectionDescriptions } from '@/components/collections';
import { InstantSearch } from '@/components/interactive/command-palette';
import { MapTourCards, MapTourPage } from '@/components/map-tour-page';
import { mapTourBySlug } from '@/lib/map-tours';
import { heritagePlaces } from '@/lib/heritage-places';
import { HeritageAtlas } from '@/components/interactive/heritage-atlas';
import { ContentFAQ, ContentGuidePage, EvidenceGuide } from '@/components/content-guides';
import { guidePages } from '@/lib/reading-guides';
import { KnowledgePage, DictionaryPage, TimelinePage, KnowledgeLinksPage, WhyPage, MemoriesPage } from '@/components/knowledge-pages';
import { knowledgePages, domainById } from '@/lib/knowledge-taxonomy';

export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ segments: string[] }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

const titles: Record<string, string> = {
  'kham-pha': 'Khám phá', 'tim-kiem': 'Tìm kiếm', 'ban-do': 'Bản đồ', 'hanh-trinh': 'Hành trình',
  'ky-uc-cong-dong': 'Gửi ký ức', 'so-tay': 'Sổ tay của bạn', 'nguon-tu-lieu': 'Nguồn tư liệu',
  'hoi-dap': 'Tra cứu', 've-du-an': 'Về dự án', 'quan-tri': 'Bàn biên tập',
};

const descriptions: Record<string, string> = {
  'kham-pha': 'Tìm và lọc hồ sơ văn hóa Nam Bộ theo chuyên mục: tên đất, nếp nhà, lễ hội, nghề và lời ăn tiếng nói, mỗi hồ sơ có nguồn để đối chiếu.',
  'ban-do': 'Bản đồ di sản Cần Thơ: các điểm trong tour bản đồ và hồ sơ, xem 2D hoặc 3D vệ tinh, kèm trạng thái đối chiếu tọa độ.',
  'hanh-trinh': 'Tour bản đồ 3D có thuyết minh dẫn nguồn và hành trình đọc nối các hồ sơ văn hóa Nam Bộ.',
  'nguon-tu-lieu': 'Danh mục nguồn tư liệu mà các hồ sơ Nam Bộ Ký Sự dẫn tới: cơ quan chuyên môn, thư viện, báo chí, từ điển mở, dữ liệu bản đồ.',
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { segments } = await params;
  let title = titles[segments[0]] ?? 'Thư viện văn hóa';
  let description: string | undefined = descriptions[segments[0]];
  let image: string | undefined;
  let type: 'website' | 'article' = 'website';
  const guide = guidePages.find(page => page.slug === segments[0]);
  if (guide) { title = guide.title; description = guide.description; }
  title = knowledgePages.find(page => page.slug === segments[0])?.title ?? title;
  if (segments[0] === 'chuyen-de') { const d = domainById(segments[1]); title = d?.name ?? title; description = d?.description ?? description; }
  if (segments[0] === 'chuyen-muc') { const c = categories.find(x => x.slug === segments[1]); title = c?.name ?? title; description = collectionDescriptions[segments[1]]?.intro ?? description; }
  if (segments[0] === 'hanh-trinh' && segments[1]) { const t = mapTourBySlug(segments[1]); title = t?.title ?? title; description = t?.summary ?? description; image = t?.cover?.src; }
  if (segments[0] === 'ho-so') {
    try {
      const c = await content(segments[1]);
      title = c?.title ?? 'Hồ sơ chưa công bố';
      description = c ? String(c.summary ?? c.introduction ?? '') || undefined : undefined;
      image = c?.image_url ?? undefined; type = 'article';
    } catch { /* dùng tiêu đề mặc định */ }
  }
  const path = '/' + segments.map(encodeURIComponent).join('/');
  return {
    title, description,
    alternates: { canonical: path },
    openGraph: { title, description, type, locale: 'vi_VN', siteName: 'Nam Bộ Ký Sự', url: path, images: image ? [{ url: image }] : undefined },
    robots: segments[0] === 'quan-tri' || segments[0] === 'so-tay' ? { index: false, follow: false } : undefined,
  };
}

function Body({ text }: { text: string }) {
  return (
    <div className="article-body">
      {text.split(/\n\s*\n/).map((p, i) => p.startsWith('## ') ? <h2 key={i}>{p.replace(/^## /, '')}</h2> : <p key={i} className="preserve">{p}</p>)}
    </div>
  );
}

function Save({ id, kind, back, user }: { id: string; kind: string; back: string; user: Row | null }) {
  return user
    ? <ActionForm action="bookmark" id={id} back={back} className="inline-form"><input type="hidden" name="kind" value={kind} /><button className="button outline">Lưu vào sổ tay</button></ActionForm>
    : <a className="button outline" href="/huong-dan-doc">Gợi ý đọc và đối chiếu</a>;
}

const sourceTypeLabels: Record<string, string> = {
  official_pdf: 'Văn bản chính thức (PDF)', official_register: 'Danh mục ghi danh chính thức', official_dataset: 'Dữ liệu cơ quan nhà nước', official_article: 'Bài trên cổng thông tin chính thức', official_record: 'Hồ sơ chính thức',
  journalism: 'Báo chí', journalism_article: 'Bài báo', journalism_report: 'Phóng sự', journalism_interview: 'Phỏng vấn trên báo', journalism_report_interview: 'Phóng sự, phỏng vấn',
  geo_api: 'Dịch vụ dữ liệu bản đồ', geo_license: 'Giấy phép dữ liệu bản đồ', geo_download: 'Dữ liệu bản đồ tải về', unesco_profile: 'Hồ sơ UNESCO',
  open_dictionary: 'Từ điển mở', book_notice: 'Thông tin sách', library_catalog: 'Thư mục thư viện',
  academic_article: 'Bài nghiên cứu', research_article: 'Bài nghiên cứu', organizer_report: 'Báo cáo của đơn vị tổ chức', official_portal_republication: 'Đăng lại trên cổng thông tin chính thức',
  journalism_republication: 'Bài báo đăng lại', historical_book_transcription: 'Bản chép sách cổ', bibliographic_index: 'Chỉ mục thư tịch',
};
const kindLabels: Record<string, string> = { place: 'Địa điểm', custom: 'Phong tục', festival: 'Lễ hội', heritage: 'Di sản và nghề', proverb: 'Tục ngữ', dialect: 'Mục từ' };
const tourKind: Record<string, string> = { physical: 'Đi thực địa', digital: 'Đọc từ xa', memory: 'Ký ức' };

export default async function Page({ params, searchParams }: Props) {
  await ensureSeed();
  const { segments: s } = await params;
  const raw = await searchParams;
  const q: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(raw)) q[k] = Array.isArray(v) ? v[0] : v;
  const user = await viewer();
  const route = s[0];
  if (route === 'chuyen-de') { if (s.length !== 2 || !domainById(s[1])) notFound(); return <KnowledgePage params={q} domainId={s[1]} />; }
  if (knowledgePages.some(page => page.slug === route)) {
    if (s.length !== 1) notFound();
    if (route === 'tri-thuc') return <KnowledgePage params={q} />;
    if (route === 'tu-dien') return <DictionaryPage params={q} />;
    if (route === 'dong-thoi-gian') return <TimelinePage params={q} />;
    if (route === 'lien-ket-tri-thuc') return <KnowledgeLinksPage params={q} />;
    if (route === 'vi-sao-lai-the') return <WhyPage />;
    return <MemoriesPage />;
  }
  if (s.length === 1 && guidePages.some(page => page.slug === route)) return <ContentGuidePage slug={route} />;

  if (route === 'quan-tri') return user ? <Admin path={s.slice(1)} user={user} params={q} /> : <main id="main" className="wrap page"><SignIn returnTo="/quan-tri" /></main>;

  if (route === 'chuyen-muc') {
    if (!categories.some(c => c.slug === s[1])) notFound();
    return <CollectionPage slug={s[1]} params={q} user={user} />;
  }

  if (route === 'kham-pha' || route === 'tim-kiem') {
    const items = await publicContents();
    const cat = categories.find(c => c.slug === q['chuyen-muc']);
    const kind = q.loai && kindLabels[q.loai] ? q.loai : undefined;
    const inCat = cat ? items.filter(i => (cat.types as readonly string[]).includes(i.category)) : items;
    const shown = kind ? inCat.filter(i => i.content_kind === kind) : inCat;
    const link = (patch: Record<string, string | undefined>) => {
      const next = new URLSearchParams();
      const merged = { 'chuyen-muc': cat?.slug, loai: kind, ...patch };
      for (const [k, v] of Object.entries(merged)) if (v) next.set(k, v);
      const qs = next.toString();
      return `/${route}${qs ? `?${qs}` : ''}`;
    };
    const kinds = Object.keys(kindLabels).filter(k => inCat.some(i => i.content_kind === k));
    return (
      <main id="main" className="wrap page page-explore">
        <Breadcrumb items={[{ label: route === 'tim-kiem' ? 'Tìm kiếm' : 'Khám phá' }]} />
        <PageTitle title={route === 'tim-kiem' ? 'Bạn đang tìm gì?' : 'Khám phá Nam Bộ'} description={`${items.length} hồ sơ đã kiểm chứng nguồn: tên đất, nếp nhà, lễ hội, nghề và lời ăn tiếng nói. Gõ để tìm ngay, hoặc lọc theo chuyên mục.`} />
        <InstantSearch initial={q.q ?? ''}>
          <div className="explore-filters" aria-label="Bộ lọc hồ sơ">
            <div className="filter-group" role="group" aria-labelledby="loc-chuyen-muc">
              <span id="loc-chuyen-muc" className="filter-label">Chuyên mục</span>
              <div className="filter-chips">
                <a className={`nb-chip ${!cat ? 'is-on' : ''}`} href={link({ 'chuyen-muc': undefined, loai: undefined })} aria-current={!cat ? 'true' : undefined}>Tất cả <small>{items.length}</small></a>
                {categories.map(c => {
                  const n = items.filter(i => (c.types as readonly string[]).includes(i.category)).length;
                  return <a key={c.slug} className={`nb-chip ${cat?.slug === c.slug ? 'is-on' : ''}`} href={link({ 'chuyen-muc': c.slug, loai: undefined })} aria-current={cat?.slug === c.slug ? 'true' : undefined}>{c.name} <small>{n}</small></a>;
                })}
              </div>
            </div>
            {kinds.length > 1 && (
              <div className="filter-group" role="group" aria-labelledby="loc-loai">
                <span id="loc-loai" className="filter-label">Loại hồ sơ</span>
                <div className="filter-chips">
                  <a className={`nb-chip ${!kind ? 'is-on' : ''}`} href={link({ loai: undefined })} aria-current={!kind ? 'true' : undefined}>Mọi loại</a>
                  {kinds.map(k => <a key={k} className={`nb-chip ${kind === k ? 'is-on' : ''}`} href={link({ loai: k })} aria-current={kind === k ? 'true' : undefined}>{kindLabels[k]} <small>{inCat.filter(i => i.content_kind === k).length}</small></a>)}
                </div>
              </div>
            )}
          </div>
          <div className="explore-head">
            <p className="result-count" role="status">{shown.length} hồ sơ{cat ? ` trong ${cat.name}` : ''}{kind ? `, loại ${kindLabels[kind].toLowerCase()}` : ''}</p>
            {(cat || kind) && <a className="nb-text-button" href={`/${route}`}>Xóa bộ lọc</a>}
            {cat && <a className="text-link" href={`/chuyen-muc/${cat.slug}`}>Mở trang chuyên mục {cat.name}</a>}
          </div>
          {shown.length ? <ContentCards items={shown} /> : <Empty title="Không có hồ sơ khớp bộ lọc" description="Thử bỏ bớt một bộ lọc, hoặc gõ từ khóa vào ô tìm kiếm ở trên." action={`/${route}`} label="Xóa bộ lọc" />}
        </InstantSearch>
      </main>
    );
  }

  if (route === 'ho-so') {
    const c = await content(s[1]);
    if (!c) notFound();
    return <PublicDossier article={c} user={user} params={q} />;
  }

  if (route === 'nguon-tu-lieu') {
    let sources = await all('SELECT * FROM source_registry ORDER BY id');
    if (q.q) sources = sources.filter(x => fold(x.name + ' ' + x.topics).includes(fold(q.q!)));
    return (
      <main id="main" className="wrap page">
        <Breadcrumb items={[{ label: 'Nguồn tư liệu' }]} />
        <PageTitle title="Nguồn để lần theo" description="Cơ quan chuyên môn, thư viện, báo chí, từ điển mở và dữ liệu bản đồ mà các hồ sơ dẫn tới. Có tên trong danh sách chưa có nghĩa là toàn bộ nội dung của nguồn đã được kiểm chứng." />
        <details className="admin-box"><summary>Cách đọc danh sách nguồn và nhãn kiểm chứng</summary><EvidenceGuide /><p>Một bản ghi thư mục chỉ dẫn đến tài liệu cần tìm. Với bài đã công bố, xem mục Nguồn tham khảo trong từng hồ sơ để biết nhận định nào đã được đối chiếu, ở trang hoặc đoạn nào.</p></details>
        <SearchForm action="/nguon-tu-lieu" q={q.q} placeholder="Tìm tên tài liệu hoặc chủ đề" />
        <p className="result-count">{sources.length} nguồn</p>
        <div className="source-list">
          {sources.map(x => (
            <article className="source-card" key={x.id}>
              <div className="source-id">{x.id}</div>
              <div>
                <p className="eyebrow">{sourceTypeLabels[String(x.source_type)] ?? String(x.source_type).replace(/_/g, ' ')}{x.format ? `, ${x.format}` : ''}</p>
                <h2><a href={x.url} target="_blank" rel="noreferrer">{x.name} <Arrow diagonal /></a></h2>
                {x.notes && <p>{x.notes}</p>}
                {x.publisher && <p><strong>Đơn vị xuất bản:</strong> {x.publisher}</p>}
                {x.source_version && <p><strong>Phiên bản đối chiếu:</strong> {x.source_version}</p>}
                {x.rights && <p><strong>Phạm vi sử dụng:</strong> {x.rights}</p>}
                <div className="badge-row">
                  {x.license_reported && <span className="classification">Giấy phép ghi nhận: {x.license_reported}</span>}
                  {x.topics && <span>{String(x.topics).replace(/,/g, ', ')}</span>}
                </div>
              </div>
            </article>
          ))}
        </div>
        {!sources.length && <Empty title="Không có nguồn nào khớp" description="Thử tên tài liệu hoặc chủ đề khác." action="/nguon-tu-lieu" label="Xem tất cả nguồn" />}
      </main>
    );
  }

  if (route === 'ban-do') {
    const { places, tours } = heritagePlaces(await publicContents());
    const reviewed = places.filter(p => p.coord === 'reviewed').length;
    return (
      <main id="main" className="wrap page page-map">
        <Breadcrumb items={[{ label: 'Bản đồ' }]} />
        <PageTitle title="Bản đồ di sản" description={`${places.length} địa điểm trong các tour bản đồ và hồ sơ. Chọn một điểm để xem trạng thái tọa độ, đọc hồ sơ hoặc mở chặng tour tương ứng. ${reviewed ? `${reviewed} điểm đã đối chiếu tọa độ.` : 'Hiện chưa điểm nào được đối chiếu tọa độ tại chỗ; các ghim lấy từ OpenStreetMap.'}`} />
        <HeritageAtlas places={places} tours={tours} initialId={q.diem} />
        <section className="map-tours" aria-labelledby="tour-3d">
          <div className="sec-head"><div><h2 id="tour-3d">Đi theo tour bản đồ 3D</h2><p>Camera bay qua từng chặng, kèm thuyết minh có số nguồn ở cuối mỗi câu.</p></div></div>
          <MapTourCards />
        </section>
      </main>
    );
  }

  if (route === 'hanh-trinh' && !s[1]) {
    let tours = await publicTours();
    if (q.loai) tours = tours.filter(t => t.kind === q.loai);
    const showMap = !q.loai || q.loai === 'physical';
    return (
      <main id="main" className="wrap page">
        <Breadcrumb items={[{ label: 'Hành trình' }]} />
        <PageTitle title="Hành trình" description="Tour bản đồ 3D đưa bạn bay qua từng điểm di sản, có chú thích và thuyết minh dẫn nguồn. Hành trình đọc nối vài hồ sơ thành một mạch để hiểu một chủ đề từ nhiều phía." />
        <div className="filter-tabs">
          {[['', 'Tất cả'], ['physical', 'Tour bản đồ 3D'], ['digital', 'Đọc từ xa'], ['memory', 'Ký ức']].map(([v, l]) => (
            <a className={(q.loai ?? '') === v ? 'active' : ''} href={`/hanh-trinh${v ? '?loai=' + v : ''}`} key={v}>{l}</a>
          ))}
        </div>
        {showMap && (
          <section className="tour-index-block" aria-labelledby="tour-3d">
            <div className="sec-head"><div><h2 id="tour-3d">Tour bản đồ 3D</h2><p>Bay qua từng điểm di sản, nghe thuyết minh có số nguồn ở cuối mỗi câu.</p></div></div>
            <MapTourCards />
          </section>
        )}
        {tours.length ? (
          <section aria-labelledby="tour-doc">
            {showMap && <div className="sec-head tour-doc-head"><div><h2 id="tour-doc">Hành trình đọc</h2><p>Chuỗi hồ sơ để đọc từ xa, không phải tuyến đi thực địa.</p></div></div>}
            <div className="content-grid">
              {tours.map(t => (
                <a className="tour-card" href={`/hanh-trinh/${t.slug}`} key={t.id}>
                  <span className="eyebrow">{tourKind[t.kind] ?? t.kind}, {t.stop_count} chặng</span>
                  <h2>{t.title}</h2>
                  <p>{t.description}</p>
                  <span className="text-link">Bắt đầu <Arrow /></span>
                </a>
              ))}
            </div>
          </section>
        ) : !showMap && (
          <Empty title="Chưa có hành trình ở mục này" description="Hành trình mới sẽ mở khi đủ hồ sơ đã kiểm chứng." action="/hanh-trinh" label="Xem tất cả hành trình" />
        )}
      </main>
    );
  }

  if (route === 'hanh-trinh' && s[1]) {
    const mapTour = mapTourBySlug(s[1]);
    if (mapTour) return <MapTourPage tour={mapTour} readingTours={await publicTours()} />;
    const tour = (await publicTours()).find(t => t.slug === s[1]);
    if (!tour) notFound();
    const stops = await tourStops(tour.id);
    const progress = user ? await one('SELECT stop_id FROM tour_progress WHERE user_id=? AND tour_id=?', user.userId, tour.id) : null;
    const active = stops.find(x => x.stop_id === q.chang) ?? stops.find(x => x.stop_id === progress?.stop_id) ?? stops[0];
    const index = stops.findIndex(x => x.stop_id === active.stop_id);
    const back = `/hanh-trinh/${tour.slug}`;
    return (
      <main id="main" className="wrap page">
        <Flash params={q} />
        <Breadcrumb items={[{ label: 'Hành trình', href: '/hanh-trinh' }, { label: tour.title }]} />
        <PageTitle eyebrow={`${tourKind[tour.kind] ?? tour.kind}, ${stops.length} chặng`} title={tour.title} description={tour.description}>
          <div className="page-title-actions"><Save id={tour.id} kind="tour" back={back} user={user} /></div>
        </PageTitle>
        <div className="nb-tour-progress" role="progressbar" aria-valuemin={1} aria-valuemax={stops.length} aria-valuenow={index + 1} aria-label="Tiến độ hành trình"><span style={{ width: `${((index + 1) / stops.length) * 100}%` }} /></div>
        <div className="tour-layout">
          <nav aria-label="Các chặng">
            {stops.map((stop, i) => (
              <a className={stop.stop_id === active.stop_id ? 'active' : ''} aria-current={stop.stop_id === active.stop_id ? 'step' : undefined} key={stop.stop_id} href={`${back}?chang=${stop.stop_id}`}>
                <span>{i + 1}</span>{stop.title}
              </a>
            ))}
          </nav>
          <article key={active.stop_id}>
            <p className="eyebrow">Chặng {index + 1} trên {stops.length}</p>
            <h2>{active.title}</h2>
            <p className="tour-summary">{active.summary}</p>
            <Body text={active.body ?? ''} />
            <p className="tour-more"><a className="text-link" href={`/ho-so/${active.slug}`}>Đọc hồ sơ đầy đủ và nguồn</a></p>
            <div className="tour-controls">
              {index > 0 && <a className="button outline" href={`${back}?chang=${stops[index - 1].stop_id}`}>Chặng trước</a>}
              {index < stops.length - 1 && <a className="button" href={`${back}?chang=${stops[index + 1].stop_id}`}>Chặng tiếp <Arrow /></a>}
              {user && (
                <ActionForm action="progress" id={tour.id} back={back} className="inline-form">
                  <input type="hidden" name="stop_id" value={active.stop_id} />
                  <button className="button outline">Lưu tiến độ ở chặng này</button>
                </ActionForm>
              )}
            </div>
          </article>
        </div>
      </main>
    );
  }

  if (route === 'ky-uc-cong-dong') {
    const own = user ? await all('SELECT id,title,status,created_at,review_note FROM community_submissions WHERE user_id=? ORDER BY created_at DESC', user.userId) : [];
    return (
      <main id="main" className="wrap page">
        <Flash params={q} />
        <Breadcrumb items={[{ label: 'Gửi ký ức' }]} />
        <PageTitle title="Gửi một ký ức" description="Một lời kể, một cách gọi trong nhà, ký ức về một nơi chốn. Cho biết bạn nghe từ ai, khi nào, và có tư liệu nào để đối chiếu." />
        {user ? (
          <div className="two-column">
            <section className="admin-box">
              <h2>Điều bạn muốn gửi</h2>
              <ActionForm action="submission" back="/ky-uc-cong-dong">
                <label>Tên câu chuyện<input name="title" required maxLength={160} /></label>
                <label>Loại tư liệu<select name="kind"><option value="memory">Hồi ức, lời kể</option><option value="dialect">Từ ngữ địa phương</option><option value="folklore">Ca dao, chuyện dân gian</option><option value="family-document">Tư liệu gia đình</option></select></label>
                <label>Nội dung<textarea name="body" rows={9} required maxLength={12000} /></label>
                <label>Bạn nghe hoặc thấy ở đâu, khi nào? Có tư liệu nào để đối chiếu?<textarea name="provenance" rows={4} required maxLength={2000} /></label>
                <label className="check"><input type="checkbox" name="storage_consent" required />Tôi có quyền gửi nội dung này và đồng ý để dự án lưu, đọc, liên hệ và thẩm định.</label>
                <label className="check"><input type="checkbox" name="publication_consent" />Tôi đồng ý cho đăng kèm tên hiển thị sau khi được biên tập và kiểm chứng.</label>
                <p className="help-text">Nội dung gửi chưa được đăng ngay. Hiện chỉ nhận văn bản, chưa nhận ảnh hay âm thanh.</p>
                <button className="button">Gửi cho ban biên tập <Arrow /></button>
              </ActionForm>
            </section>
            <aside>
              <h2>Vài lưu ý nhỏ</h2>
              <ol className="process-list">
                <li>Ghi rõ đây là trải nghiệm, lời kể hay tư liệu ghi chép.</li>
                <li>Giữ nguyên cách gọi địa phương và ghi thời điểm dùng.</li>
                <li>Không gửi toàn văn sách hay tư liệu của người khác khi chưa có quyền.</li>
                <li>Điều chưa chắc thì cứ để trống.</li>
              </ol>
              <h2>Bạn đã gửi</h2>
              {own.length ? own.map(x => <div className="submission-item" key={x.id}><h3>{x.title}</h3><Status status={x.status} /><p>{x.review_note || 'Đang chờ ban biên tập xem.'}</p></div>) : <p>Bạn chưa gửi gì.</p>}
            </aside>
          </div>
        ) : <SignIn returnTo="/ky-uc-cong-dong" />}
      </main>
    );
  }

  if (route === 'so-tay') {
    if (!user) return <main id="main" className="wrap page"><SignIn /></main>;
    const saves = await all('SELECT * FROM user_bookmarks WHERE user_id=? ORDER BY created_at DESC', user.userId);
    const [items, tours] = await Promise.all([publicContents(), publicTours()]);
    const savedItems = items.filter(c => saves.some(b => b.kind === 'content' && b.target_id === c.id));
    const savedTours = tours.filter(t => saves.some(b => b.kind === 'tour' && b.target_id === t.id));
    return (
      <main id="main" className="wrap page">
        <Flash params={q} />
        <PageTitle title="Sổ tay của bạn" description={`Chào ${user.displayName}. Hồ sơ và hành trình bạn lưu nằm ở đây, theo tài khoản của bạn.`} />
        <section className="nb-notebook-section">
          <h2>Hồ sơ đã lưu</h2>
          {savedItems.length ? <ContentCards items={savedItems} /> : <Empty title="Sổ tay còn trống" description="Mở một hồ sơ và bấm “Lưu vào sổ tay” để đọc lại sau." action="/kham-pha" label="Mở thư viện" />}
        </section>
        <section className="nb-notebook-section">
          <h2>Hành trình đã lưu</h2>
          {savedTours.length ? <div className="content-grid">{savedTours.map(t => <a className="tour-card" key={t.id} href={`/hanh-trinh/${t.slug}`}><h2>{t.title}</h2><span className="text-link">Đọc tiếp <Arrow /></span></a>)}</div> : <p>Chưa có hành trình nào được lưu.</p>}
        </section>
      </main>
    );
  }

  if (route === 'hoi-dap') {
    return (
      <main id="main" className="wrap page">
        <PageTitle title="Tra cứu" description="Tìm trong các hồ sơ đã đăng. Câu hỏi về nguồn gốc tên đất, phong tục hay từ ngữ chỉ được trả lời bằng hồ sơ có nguồn." />
        <InstantSearch initial={q.q ?? ''}>
          <div className="notice">Hỏi đáp bằng AI chưa được bật. Trang này chỉ tìm trong các hồ sơ đã kiểm chứng, không tự tạo câu trả lời.</div>
        </InstantSearch>
        <ContentFAQ />
      </main>
    );
  }

  if (route === 've-du-an') {
    const n = await stats();
    return (
      <main id="main" className="wrap page narrow">
        <PageTitle title="Kể chuyện để hiểu, hiểu để gìn giữ." description="Nam Bộ Ký Sự gom những câu chuyện về đất, nếp sống và tiếng nói miền Tây, bắt đầu từ Cần Thơ, Hậu Giang và Sóc Trăng." />
        <div className="metric-grid">
          {([[n.verified, 'đã kiểm chứng nguồn'], [n.pending, 'chờ kiểm chứng'], [n.eligible, 'đủ điều kiện hiển thị']] as const).map(([v, l]) => <div key={l}><strong>{v}</strong><span>{l}</span></div>)}
        </div>
        <Body text={'## Mỗi hồ sơ có đường về nguồn\n\nDự án tách riêng dữ kiện có tư liệu, giả thuyết, truyền thuyết, dị bản và lời kể. Điều chưa rõ được ghi là chưa rõ.\n\n## Giữ sự khác biệt\n\nMột cách làm không đại diện cho mọi gia đình hay cộng đồng. Hồ sơ ghi rõ phạm vi, thời điểm và các cách nhìn có nguồn.\n\n## Có quyền mới chia sẻ\n\nĐọc được một trang web không có nghĩa là được dùng lại ảnh, âm thanh hay toàn văn sách. Từng tư liệu được xét quyền riêng trước khi đăng.'} />
        <p className="page-cta"><a className="button" href="/nguon-tu-lieu">Xem các nguồn tư liệu</a></p>
        <section className="article-body"><h2>Đi sâu hơn vào cách đọc và cách làm</h2><ul>{guidePages.map(page => <li key={page.slug}><a href={`/${page.slug}`}>{page.title}</a> — {page.description}</li>)}</ul><p>Thư viện có {n.published} hồ sơ hiển thị và {n.sources} nguồn đăng ký. Số liệu theo dõi tự cập nhật từ kho; đầu mối chưa kiểm chứng vẫn được giữ để nghiên cứu tiếp.</p></section>
      </main>
    );
  }

  notFound();
}
