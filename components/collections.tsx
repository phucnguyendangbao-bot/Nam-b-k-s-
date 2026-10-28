import Image from 'next/image';
import { mapToursFor } from '@/lib/map-tours';
import { notFound } from 'next/navigation';
import { ActionForm, Arrow, Breadcrumb, Classification, Flash, Motif, Status, categoryTone } from './site';
import { all, contentCitations, one, publicContents, publicTours, publicWords, type Row } from '@/lib/static-data';
import { categories } from '@/lib/catalog';
import { nfc, parseSections, sectionLabels, topics } from '@/lib/editorial-model';
import { LexiconPlay } from './interactive/lexicon-play';
import { KnowledgeContext } from './knowledge-context';
import { knowledgeRelated } from '@/lib/knowledge';

export const collectionDescriptions: Record<string, { intro: string; note: string }> = {
  'dat-nam-bo': {
    intro: 'Tên đất, nhà cổ, chợ trên sông. Mỗi cách giải thích được đặt đúng chỗ của nó: tư liệu là tư liệu, giai thoại là giai thoại.',
    note: 'Giả thuyết về tên đất được ghi riêng với sự kiện lịch sử. Địa chỉ theo tư liệu không xác nhận ranh giới hành chính hay tuyến tham quan hiện tại.',
  },
  'nep-xua': {
    intro: 'Cưới hỏi, đám giỗ và nếp nhà, kể qua những gia đình và người nghiên cứu đã được ghi lại. Ý nghĩa là gì, ở đâu làm vậy, điều nào chỉ là quan niệm dân gian?',
    note: 'Không có một trình tự nghi lễ đúng cho mọi gia đình. Hồ sơ còn thiếu tư liệu về địa bàn, thời kỳ hoặc quyền sử dụng tiếp tục được giữ ở bản nháp.',
  },
  'tieng-que-minh': {
    intro: 'Bậu, qua, mần, bển, hổng. Tra nghĩa, xem ngữ cảnh, lật thẻ và thử trắc nghiệm. Mỗi mục từ đều dẫn về nguồn ghi chép.',
    note: 'Các từ không mặc định chỉ có ở Nam Bộ. Câu ví dụ do ban biên soạn đặt và được ghi rõ như vậy, không phải ca dao hay lời kể sưu tầm.',
  },
  'loi-nguoi-xua': {
    intro: 'Đọc tục ngữ từ một bản in cũ, đối chiếu nguyên văn và lời giải của người sưu tập. Bắt đầu với hai câu trong sách Huỳnh Tịnh Của năm 1897.',
    note: 'Mỗi câu ghi rõ loại hình và trang sách. Có mặt trong sách in ở Sài Gòn không chứng minh câu chỉ thuộc Nam Bộ; phần ca dao và chuyện kể chưa đủ chứng cứ vẫn ở bản nháp.',
  },
  'le-hoi': {
    intro: 'Đón năm mới, gặp nhau bên bờ sông, ngước nhìn mùa trăng. Đọc Chôl Chnăm Thmây, Oóc Om Bóc và đua ghe Ngo qua những tư liệu có thể lần theo.',
    note: 'Lịch truyền thống và một mùa lễ được ghi nhận không thay cho thông báo tổ chức năm nay. Niềm tin tâm linh được trình bày là niềm tin của cộng đồng, không phải kết luận khoa học.',
  },
  'dau-xua': {
    intro: 'Di sản sống qua tiếng đờn, người diễn và bàn tay làm nghề: đờn ca tài tử, sân khấu Rô Băm và nghề bánh pía.',
    note: 'Hồ sơ ghi danh và câu chuyện người thực hành có phạm vi chứng minh khác nhau. Danh hiệu di sản không tự cấp quyền sử dụng bản nhạc, ảnh biểu diễn hoặc sản phẩm của nghệ nhân.',
  },
};

export function DossierCards({ items, preview = false }: { items: Row[]; preview?: boolean }) {
  return (
    <div className="nb-card-grid">
      {items.map(c => {
        const href = preview ? `/quan-tri/ban-thao/${c.id}` : `/ho-so/${c.slug}`;
        const isWord = c.content_kind === 'dialect';
        const tone = isWord ? 'lily' : c.content_kind === 'custom' ? 'dusk' : 'river';
        return (
          <article className={`nb-story-card tone-${tone}`} key={c.id}>
            <a className="nb-story-media" href={href} tabIndex={-1} aria-hidden="true">
              {c.image_url
                ? <Image src={c.image_url} alt="" width={1600} height={1067} unoptimized loading="lazy" />
                : isWord ? <span className="nb-story-word">{nfc(c.title)}</span> : <Motif kind={c.topic === 'architecture' ? 'house' : c.content_kind === 'custom' ? 'book' : 'river'} />}
              <span className="nb-sticker">{topics[c.topic] ?? c.historical_area}</span>
            </a>
            <div className="nb-story-body">
              <h3 className={isWord ? 'sr-only-title' : undefined}><a href={href}>{nfc(c.title)}</a></h3>
              {c.part_of_speech && <p className="nb-word-pos">{c.part_of_speech}</p>}
              <p>{c.meaning ?? c.summary}</p>
              <a className="nb-link" href={href}>{preview ? 'Xem bản chuẩn bị' : isWord ? 'Xem nghĩa và nguồn' : 'Đọc hồ sơ'} <Arrow /></a>
              {preview && <Status status={c.cms_status ?? 'draft'} />}
            </div>
            {c.image_url && <small className="nb-story-credit">Ảnh: {c.image_author}, <a href={c.image_source_url} target="_blank" rel="noreferrer">{c.image_license}</a></small>}
          </article>
        );
      })}
    </div>
  );
}

function Chip({ href, on, children }: { href: string; on: boolean; children: React.ReactNode }) {
  return <a className={`nb-chip ${on ? 'is-on' : ''}`} href={href} aria-current={on ? 'true' : undefined}>{children}</a>;
}

export async function CollectionPage({ slug, params, user }: { slug: string; params: Record<string, string | undefined>; user: Row | null }) {
  const collection = categories.find(c => c.slug === slug);
  const copy = collectionDescriptions[slug];
  if (!collection || !copy) notFound();
  const tone = categoryTone[slug];
  const types = collection.types.join(',');
  const allItems = await publicContents('', types);
  let filtered = params.q ? await publicContents(params.q, types) : [...allItems];
  if (params.topic) filtered = filtered.filter(c => c.topic === params.topic);
  if (params.area) filtered = filtered.filter(c => c.historical_area === params.area);
  if (params.word_type) filtered = filtered.filter(c => c.part_of_speech === params.word_type);
  const priority = ['E020', 'E021', 'NBS-BINH-THUY', 'NBS-CHO-NOI', 'E001', 'E008', 'E029', 'E030', 'E031', 'E032', 'E033'];
  const rank = (id: string) => (priority.indexOf(id) < 0 ? 999 : priority.indexOf(id));
  if (params.sort === 'az') filtered.sort((a, b) => a.title.localeCompare(b.title, 'vi'));
  else if (!params.q) filtered.sort((a, b) => rank(a.id) - rank(b.id));
  const availableTopics = [...new Set(allItems.map(c => c.topic).filter(Boolean))] as string[];
  const wordTypes = [...new Set(allItems.map(c => c.part_of_speech).filter(Boolean))] as string[];
  const words = slug === 'tieng-que-minh' ? await publicWords() : [];
  const base = `/chuyen-muc/${slug}`;
  const link = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...params, ...patch })) if (v && ['q', 'topic', 'word_type', 'sort', 'area'].includes(k)) next.set(k, v);
    const qs = next.toString();
    return qs ? `${base}?${qs}` : base;
  };
  const isWords = slug === 'tieng-que-minh';
  const unit = isWords ? 'mục từ' : 'hồ sơ';

  return (
    <main id="main" className="wrap page">
      <Breadcrumb items={[{ label: 'Khám phá', href: '/kham-pha' }, { label: collection.name }]} />
      <header className={`nb-collection-hero tone-${tone}`} style={allItems.find(i => i.image_url) ? { backgroundImage: `url(${allItems.find(i => i.image_url)!.image_url})` } : undefined}>
        <h1>{nfc(collection.name)}</h1>
        <p>{copy.intro}</p>
        <Motif kind={collection.motif} />
      </header>
      <nav className="nb-collection-tabs" aria-label="Các chuyên mục">
        {categories.map(c => <a key={c.slug} href={`/chuyen-muc/${c.slug}`} aria-current={slug === c.slug ? 'page' : undefined}>{nfc(c.name)}</a>)}
      </nav>

      {isWords && words.length > 0 && <LexiconPlay words={words} />}

      {allItems.length > 0 && (
        <div className="nb-filter" style={{ marginTop: isWords ? 44 : 0 }}>
          <form className="search-form" action={base} method="get" role="search">
            <label className="sr-only" htmlFor="collection-q">{isWords ? 'Tìm từ, nghĩa hoặc ngữ cảnh' : 'Tìm bài, địa danh hoặc chủ đề'}</label>
            <svg className="nb-search-glyph" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2.4" /><path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>
            <input id="collection-q" name="q" defaultValue={params.q} maxLength={160} placeholder={isWords ? 'Ví dụ: bậu, làm, xưng hô' : 'Gõ có dấu hay không dấu đều được'} />
            {params.topic && <input type="hidden" name="topic" value={params.topic} />}
            {params.word_type && <input type="hidden" name="word_type" value={params.word_type} />}
            <button type="submit" aria-label="Tìm"><Arrow /></button>
          </form>
          {availableTopics.length > 1 && (
            <div className="nb-filter-row">
              <span>Chủ đề</span>
              <Chip href={link({ topic: undefined })} on={!params.topic}>Tất cả</Chip>
              {availableTopics.map(t => <Chip key={t} href={link({ topic: t })} on={params.topic === t}>{topics[t] ?? t}</Chip>)}
            </div>
          )}
          {isWords && wordTypes.length > 1 && (
            <div className="nb-filter-row">
              <span>Loại từ</span>
              <Chip href={link({ word_type: undefined })} on={!params.word_type}>Tất cả</Chip>
              {wordTypes.map(t => <Chip key={t} href={link({ word_type: t })} on={params.word_type === t}>{t}</Chip>)}
            </div>
          )}
          <div className="nb-filter-row">
            <span>Sắp xếp</span>
            <Chip href={link({ sort: undefined })} on={params.sort !== 'az'}>Nên đọc trước</Chip>
            <Chip href={link({ sort: 'az' })} on={params.sort === 'az'}>Tên A–Z</Chip>
          </div>
          <p className="collection-count" role="status">
            {filtered.length} {unit}{params.q ? ` cho “${nfc(params.q)}”` : ''}
            {(params.q || params.topic || params.word_type) && <> · <a className="nb-text-button" href={base}>Xóa bộ lọc</a></>}
          </p>
        </div>
      )}

      {filtered.length ? <DossierCards items={filtered} /> : (
        <div className="empty-state">
          <Motif kind={collection.motif} />
          <h2>{allItems.length ? 'Không có kết quả phù hợp' : 'Chuyên mục đang biên soạn'}</h2>
          <p>{allItems.length ? 'Thử một từ khóa hoặc bộ lọc khác.' : 'Những hồ sơ đầu tiên đang được đối chiếu nguồn và quyền sử dụng. Trong lúc chờ, ghé các chuyên mục đã mở nhé.'}</p>
          {allItems.length ? <a className="button outline" href={base}>Xóa bộ lọc</a> : <a className="button" href="/kham-pha">Xem các hồ sơ đã có <Arrow /></a>}
          {!allItems.length && user && ['admin', 'editor', 'researcher'].includes(user.role) && <a className="nb-text-button" href="/quan-tri/ban-thao">Mở bàn bản thảo</a>}
        </div>
      )}
      <p className="nb-note">{copy.note}</p>
    </main>
  );
}

export function DocumentaryImage({ media: m, eager = false }: { media: Row; eager?: boolean }) {
  return (
    <figure className="documentary-photo">
      <Image src={m.url} alt={m.caption} width={m.width ?? 1600} height={m.height ?? 1067} unoptimized loading={eager ? 'eager' : 'lazy'} />
      <figcaption>
        <strong>{m.caption}</strong>
        <span>{m.author}, <a href={m.source_url} target="_blank" rel="noreferrer">Wikimedia Commons</a>, <a href={m.license_url} target="_blank" rel="noreferrer">{m.license_name}</a></span>
        <details>
          <summary>Nguồn, giấy phép và thay đổi ảnh</summary>
          <dl>
            <dt>Tác giả</dt><dd>{m.author}</dd>
            <dt>Nguồn gốc</dt><dd><a href={m.source_url} target="_blank" rel="noreferrer">Trang hồ sơ ảnh trên Commons</a></dd>
            <dt>Giấy phép</dt><dd><a href={m.license_url} target="_blank" rel="noreferrer">{m.license_name}</a></dd>
            <dt>Thay đổi ảnh</dt><dd>{m.modifications}</dd>
            <dt>Ghi công</dt><dd>{m.attribution}</dd>
          </dl>
        </details>
      </figcaption>
    </figure>
  );
}

export async function PublicDossier({ article: c, user, params }: { article: Row; user: Row | null; params: Record<string, string | undefined> }) {
  const [citations, media, dialect, allRelated, tours] = await Promise.all([
    contentCitations(c.id),
    all("SELECT * FROM media_assets WHERE content_id=? AND review_status='accepted'", c.id),
    one('SELECT * FROM dialect_entries WHERE content_id=?', c.id),
    knowledgeRelated(c.id, 3).then(links => links.map(link => link.item)),
    publicTours(),
  ]);
  const related = allRelated.filter(x => x.id !== c.id).slice(0, 3);
  const relatedTours = [];
  for (const t of tours) { if (await one('SELECT id FROM tour_stops WHERE tour_id=? AND content_id=?', t.id, c.id)) relatedTours.push(t); }
  return <DossierView article={c} citations={citations} media={media} dialect={dialect} related={related} tours={relatedTours} user={user} params={params} />;
}

export function DossierView({ article: c, citations, media, dialect, related, tours, user, params = {}, preview = false }: { article: Row; citations: Row[]; media: Row[]; dialect: Row | null; related: Row[]; tours: Row[]; user: Row | null; params?: Record<string, string | undefined>; preview?: boolean }) {
  const sections = parseSections(c.sections_json ?? '[]');
  const images = media.filter(m => m.kind === 'image');
  const cover = !dialect ? images[0] : undefined;
  const gallery = cover ? images.slice(1) : images;
  const showGallery = gallery.length > 0 || images.length === 0;
  const audio = dialect?.audio_asset_id ? media.find(m => m.id === dialect.audio_asset_id && m.kind === 'audio') : null;
  const collection = categories.find(item => (item.types as readonly string[]).includes(c.category)) ?? categories[0];
  const back = preview ? `/quan-tri/ban-thao/${c.id}` : `/ho-so/${c.slug}`;
  const mapStops = preview ? [] : mapToursFor(c.id);
  return (
    <main id="main" className={`wrap page nb-dossier tone-${categoryTone[collection.slug]}`}>
      <div className="nb-progress" aria-hidden="true" />
      <Breadcrumb items={[{ label: collection.name, href: `/chuyen-muc/${collection.slug}` }, { label: c.title }]} />
      <Flash params={params} />
      {preview && (
        <div className="notice" role="status">
          <strong>Xem trước bản chuẩn bị nguồn.</strong>{' '}
          {c.live_slug ? <a className="text-link" href={`/ho-so/${c.live_slug}`}>Bài này đã được duyệt và công bố</a> : <>Trạng thái CMS: {c.cms_status ?? 'chưa nhập'}. Bản chuẩn bị không tự công bố.</>}
          <p><a className="text-link" href="/quan-tri/ban-thao">Về bàn bản thảo</a></p>
        </div>
      )}
      <div className="dossier-layout">
        <article className="dossier-main">
          <header className="nb-dossier-hero">
            <p className="eyebrow">{topics[c.topic] ?? collection.subtitle}</p>
            <h1 className={`dossier-title ${c.content_kind === 'dialect' ? 'is-word' : ''}`}>{nfc(c.title)}</h1>
            <div className="badge-row">
              <Classification value={c.classification} />
              {preview ? <Status status={c.cms_status ?? 'draft'} /> : <span>Bản duyệt số {c.revision}</span>}
              <span>{c.historical_area}</span>
            </div>
            <p className="dossier-intro">{c.introduction || c.summary}</p>
            {cover && <div className="nb-dossier-cover"><DocumentaryImage media={cover} eager /></div>}
            {c.scope_note && <p className="dossier-scope"><strong>Phạm vi bài viết: </strong>{c.scope_note}</p>}
          </header>

          {dialect && (
            <section className="lexicon-panel" id="nghia-tu">
              <p className="eyebrow">{dialect.part_of_speech}</p>
              <h2>Nghĩa và ngữ cảnh</h2>
              <p style={{ fontSize: 20, color: 'var(--ink)', fontWeight: 600 }}>{dialect.meaning}</p>
              <p>{dialect.usage_context}</p>
              <h2 style={{ marginTop: 24 }}>Ví dụ</h2>
              <p className="usage-example">{dialect.example}</p>
              <p className="help-text">{dialect.example_note}</p>
              <p className="help-text">{dialect.regional_scope}</p>
              <div className="audio-field">
                <h3>Phát âm</h3>
                {audio ? (
                  <>
                    <audio controls preload="none" src={audio.url} aria-label={`Bản ghi phát âm từ ${dialect.headword}`} />
                    <p className="help-text">Giọng đọc: {audio.author}, <a href={audio.source_url}>nguồn</a>, <a href={audio.license_url}>{audio.license_name}</a></p>
                  </>
                ) : <p className="sound-unavailable">Chưa có bản ghi phát âm được cấp quyền. Dự án không dùng giọng máy đọc thay cho bản ghi thật.</p>}
              </div>
              {!preview && <p style={{ marginTop: 18 }}><a className="button" href="/chuyen-muc/tieng-que-minh#choi">Ôn từ này bằng thẻ lật <Arrow /></a></p>}
            </section>
          )}

          {!preview && <KnowledgeContext article={c} />}

          {sections.length ? sections.map((s, i) => (
            <section className="dossier-section" id={`muc-${i + 1}`} key={i}>
              <p className={`epistemic-label kind-${s.kind}`}>{sectionLabels[s.kind]}</p>
              <h2>{s.heading}</h2>
              <p className="preserve">{s.text}</p>
              <div className="section-sources">
                {s.sourceIds.map(sid => { const e = citations.find(x => x.source_id === sid); return e ? <a key={sid} href={`#nguon-${e.id}`}>Nguồn {sid}</a> : null; })}
              </div>
            </section>
          )) : (
            <div className="article-body">
              {String(c.body ?? '').split(/\n\s*\n/).map((s, i) => s.startsWith('## ') ? <h2 key={i}>{s.slice(3)}</h2> : <p className="preserve" key={i}>{s}</p>)}
            </div>
          )}

          {showGallery && <section className="dossier-section" id="hinh-anh">
            <p className="epistemic-label">Ảnh và quyền sử dụng</p>
            <h2>Hình ảnh</h2>
            {gallery.length ? gallery.map(m => <DocumentaryImage key={m.id} media={m} />) : (
              <figure className="missing-documentary-image">
                {dialect ? <span className="word-letter">{dialect.headword}</span> : <Motif kind={c.content_kind === 'custom' ? 'book' : 'river'} />}
                <figcaption><p>Chưa có ảnh đúng nội dung được cấp quyền. Hình trên là minh họa của dự án, không phải ảnh tư liệu.</p></figcaption>
              </figure>
            )}
          </section>}

          <section className="article-references" id="nguon-tham-khao">
            <h2>Nguồn tham khảo</h2>
            <ol>
              {citations.map(e => (
                <li key={e.id} id={`nguon-${e.id}`}>
                  <a href={e.source_url} target="_blank" rel="noreferrer">{e.source_name}</a>
                  <p><strong>Vị trí đối chiếu:</strong> {e.locator}</p>
                  <p><strong>Phiên bản:</strong> {e.source_version}</p>
                  <p><strong>Nguồn xác nhận điều gì:</strong> {e.statement}</p>
                  {e.review_note && <p>{e.review_note}</p>}
                </li>
              ))}
            </ol>
          </section>
          {c.text_license && (
            <div className="text-license">
              <strong>Giấy phép phần biên soạn mục từ: </strong><a href={c.text_license_url} target="_blank" rel="noreferrer">{c.text_license}</a>
              <p>{c.rights_basis}</p>
            </div>
          )}

          <section className="related-section" id="bai-lien-quan">
            <h2>Đọc tiếp</h2>
            {related.length ? <DossierCards items={related} preview={preview} /> : <p>Chưa có hồ sơ cùng chủ đề.</p>}
          </section>
          <section className="related-section" id="tour-lien-quan">
            <h2>Có trong hành trình</h2>
            {tours.length ? tours.map(t => preview && !t.live_slug ? (
              <details className="related-tour" key={t.id}>
                <summary>{t.title} (đề xuất, chưa công bố)</summary>
                <p>{t.description}</p>
                <ol>{(t.content_ids as string[]).map(id => <li key={id}><a href={`/quan-tri/ban-thao/${id}`}>Xem chặng {id}</a></li>)}</ol>
              </details>
            ) : (
              <a className="related-tour" href={`/hanh-trinh/${t.live_slug ?? t.slug}`} key={t.id}>
                <h3>{t.title}</h3>
                <p>{t.description}</p>
                <span className="nb-link">Mở hành trình <Arrow /></span>
              </a>
            )) : !mapStops.length && <p>Hồ sơ này chưa nằm trong hành trình nào.</p>}
            {mapStops.map(({ tour: t, stop, index }) => (
              <a className="related-tour is-map" href={`/hanh-trinh/${t.slug}#chang-${index + 1}`} key={t.id}>
                <span className="eyebrow">Tour bản đồ 3D, chặng {index + 1} trên {t.stops.length}</span>
                <h3>{t.title}</h3>
                <p>{t.summary}</p>
                <span className="nb-link">Bay tới {stop.name} trên bản đồ <Arrow /></span>
              </a>
            ))}
          </section>
        </article>

        <aside className="dossier-rail">
          <h2>Trong bài này</h2>
          <nav>
            {dialect && <a href="#nghia-tu">Nghĩa, ngữ cảnh, phát âm</a>}
            {sections.map((s, i) => <a key={i} href={`#muc-${i + 1}`}>{s.heading}</a>)}
            {showGallery && <a href="#hinh-anh">Hình ảnh</a>}
            <a href="#nguon-tham-khao">Nguồn tham khảo</a>
            <a href="#bai-lien-quan">Đọc tiếp</a>
          </nav>
          {!preview && user && (
            <ActionForm action="bookmark" id={c.id} back={back} className="inline-form">
              <input type="hidden" name="kind" value="content" />
              <button className="button outline" style={{ width: '100%' }}>Lưu vào sổ tay</button>
            </ActionForm>
          )}
          {!preview && !user && <a className="button outline" href="/huong-dan-doc" style={{ width: '100%' }}>Gợi ý đọc và đối chiếu</a>}
          {preview && user && c.can_stage && ['admin', 'editor'].includes(user.role) && (
            <ActionForm action="stage_prepared" id={c.id} back={back}>
              <label className="check"><input name="review_before_import" type="checkbox" required />Đã xem bản chuẩn bị; nhập vào CMS dưới dạng nháp.</label>
              <button className="button">Đưa vào bản nháp</button>
            </ActionForm>
          )}
          {preview && c.cms_status && <p><a className="text-link" href={`/quan-tri/noi-dung/${c.id}`}>Mở phiên bản hiện tại trong CMS</a></p>}
          <p>Cộng đồng, phạm vi: {c.community}</p>
          <small>Ảnh và bản ghi có giấy phép riêng. Dẫn nguồn không có nghĩa là được chép toàn văn.</small>
        </aside>
      </div>
    </main>
  );
}
