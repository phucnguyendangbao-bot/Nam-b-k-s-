import Image from 'next/image';
import { Arrow, EvidenceMix, Motif, categoryTone, collectionFor } from '@/components/site';
import { TeaserCard } from '@/components/interactive/lexicon-play';
import { AtlasLauncher } from '@/components/interactive/atlas-launcher';
import { RouteDiagram } from '@/components/route-diagram';
import { MapTourCards } from '@/components/map-tour-page';
import { categories } from '@/lib/catalog';
import { nfc, topics } from '@/lib/editorial-model';
import { heritagePlaces } from '@/lib/heritage-places';
import { all, ensureSeed, publicContents, publicTours, publicWords, stats, type Row } from '@/lib/static-data';

export const dynamic = 'force-dynamic';

function SectionHead({ id, title, children, action }: { id: string; title: string; children?: React.ReactNode; action?: { href: string; label: string } }) {
  return (
    <div className="sec-head">
      <div>
        <h2 id={id}>{title}</h2>
        {children && <p>{children}</p>}
      </div>
      {action && <a className="text-link" href={action.href}>{action.label}</a>}
    </div>
  );
}

const curatedIds = ['NBS-CHO-NOI', 'E020', 'NBS-BINH-THUY', 'E012', 'E018'];
const teaserWords = ['mần', 'bậu', 'hổng'];

export default async function Home() {
  await ensureSeed();
  const [items, readingTours, words, numbers, media] = await Promise.all([
    publicContents(), publicTours(), publicWords(), stats(),
    all("SELECT m.url,m.caption,m.author,m.license_name,m.source_url,c.slug,c.title FROM media_assets m JOIN cultural_contents c ON c.id=m.content_id WHERE m.kind='image' AND m.review_status='accepted' ORDER BY m.id"),
  ]);
  const { places, tours } = heritagePlaces(items);
  const photo = (needle: string) => media.find(m => String(m.url).includes(needle));
  const heroMain = photo('cai-rang-market') ?? media[0];
  const heroSide = photo('binh-thuy-house-thuydaonguyen') ?? media[1];
  const curated = curatedIds.map(id => items.find(i => i.id === id)).filter((x): x is Row => Boolean(x));
  const [lead, ...rest] = curated;
  const teasers = teaserWords.map(h => words.find(w => w.headword === h)).filter(Boolean) as typeof words;

  return (
    <main id="main" className="home">
      {/* 1. Mở đầu */}
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-inner">
          <div className="hero-copy">
            <h1 id="hero-title">Đất, người và tiếng nói Nam Bộ</h1>
            <p className="hero-lede">Hồ sơ về tên đất, nếp nhà, lễ hội và lời ăn tiếng nói miền sông nước. Mỗi nhận định dẫn về nguồn, để bạn tự mở ra đối chiếu.</p>
            <form className="search-form hero-search" action="/tim-kiem" role="search">
              <label className="sr-only" htmlFor="hero-q">Tìm trong kho hồ sơ</label>
              <svg className="nb-search-glyph" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" /><path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              <input id="hero-q" name="q" placeholder="Chợ nổi, Đầu Sấu, đám giỗ, mần…" maxLength={120} autoComplete="off" />
              <button type="submit" aria-label="Tìm"><Arrow /></button>
            </form>
            <p className="hero-meta">{numbers.published} hồ sơ đã kiểm chứng, dẫn về {numbers.sources} nguồn tư liệu. <a href="/huong-dan-doc">Cách đọc một hồ sơ</a></p>
          </div>
          <div className="hero-media">
            {heroMain && (
              <figure className="hero-photo is-main">
                <Image src={heroMain.url} alt={heroMain.caption ?? heroMain.title} width={1200} height={900} priority fetchPriority="high" sizes="(max-width: 900px) 100vw, 56vw" />
                <figcaption className="label-card">
                  <a href={`/ho-so/${heroMain.slug}`}>{heroMain.title}</a>
                  <small>Ảnh: {heroMain.author}, {heroMain.license_name}</small>
                </figcaption>
              </figure>
            )}
            {heroSide && (
              <figure className="hero-photo is-side">
                <Image src={heroSide.url} alt={heroSide.caption ?? heroSide.title} width={640} height={480} sizes="(max-width: 900px) 50vw, 22vw" />
                <figcaption><a href={`/ho-so/${heroSide.slug}`}>{heroSide.title}</a><small>Ảnh: {heroSide.author}, {heroSide.license_name}</small></figcaption>
              </figure>
            )}
          </div>
        </div>
      </section>

      {/* 2. Chuyên mục */}
      <section className="home-sec" aria-labelledby="chuyen-muc">
        <div className="wrap">
          <SectionHead id="chuyen-muc" title="Sáu lối vào" action={{ href: '/kham-pha', label: 'Xem toàn bộ hồ sơ' }}>Đi theo chủ đề bạn quan tâm. Mỗi chuyên mục gom hồ sơ cùng loại tư liệu và nói rõ giới hạn của chúng.</SectionHead>
          <ul className="cat-grid">
            {categories.map(c => {
              const list = items.filter(i => (c.types as readonly string[]).includes(i.category));
              const cover = list.find(i => i.image_url);
              return (
                <li key={c.slug} className={`cat-tile tone-${categoryTone[c.slug]}`}>
                  <a href={`/chuyen-muc/${c.slug}`}>
                    <span className="cat-media" aria-hidden="true">
                      {cover ? <Image src={cover.image_url} alt="" width={480} height={360} sizes="(max-width: 640px) 40vw, 200px" /> : <Motif kind={c.motif} />}
                    </span>
                    <span className="cat-text">
                      <strong>{c.name}</strong>
                      <span>{c.subtitle}</span>
                      <small>{list.length ? `${list.length} hồ sơ` : 'Đang biên soạn'}</small>
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* 3. Hồ sơ tuyển chọn */}
      {lead && (
        <section className="home-sec is-sunken" aria-labelledby="tuyen-chon">
          <div className="wrap">
            <SectionHead id="tuyen-chon" title="Hồ sơ nên đọc trước" action={{ href: '/huong-dan-doc', label: 'Cách đọc nhãn thông tin' }}>Mỗi bài cho biết trước nó gồm những lớp nào: đoạn có tư liệu, giả thuyết hay truyền thống kể lại.</SectionHead>
            <div className="feature">
              <article className={`feature-lead tone-${categoryTone[collectionFor(lead.category).slug]}`}>
                <a className="feature-media" href={`/ho-so/${lead.slug}`} tabIndex={-1} aria-hidden="true">
                  {lead.image_url && <Image src={lead.image_url} alt="" width={1200} height={800} sizes="(max-width: 900px) 100vw, 60vw" />}
                </a>
                <div className="feature-body">
                  <p className="feature-cat">{topics[lead.topic] ?? collectionFor(lead.category).name}</p>
                  <h3><a href={`/ho-so/${lead.slug}`}>{nfc(lead.title)}</a></h3>
                  <p>{lead.introduction || lead.summary}</p>
                  <EvidenceMix sectionsJson={lead.sections_json} />
                  {lead.image_url && <small className="nb-story-credit">Ảnh: {lead.image_author}, {lead.image_license}</small>}
                </div>
              </article>
              <ol className="feature-list">
                {rest.map(c => (
                  <li key={c.id} className={`tone-${categoryTone[collectionFor(c.category).slug]}`}>
                    <a href={`/ho-so/${c.slug}`}>
                      <span className="feature-thumb" aria-hidden="true">
                        {c.image_url ? <Image src={c.image_url} alt="" width={240} height={180} sizes="120px" /> : <Motif kind={collectionFor(c.category).motif} />}
                      </span>
                      <span className="feature-text">
                        <small>{topics[c.topic] ?? collectionFor(c.category).name}</small>
                        <strong>{nfc(c.title)}</strong>
                        <EvidenceMix sectionsJson={c.sections_json} compact />
                      </span>
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      )}

      {/* 4. Bản đồ */}
      <section className="home-sec is-deep" data-surface="deep" aria-labelledby="ban-do">
        <div className="wrap map-band">
          <div className="map-band-copy on-deep">
            <SectionHead id="ban-do" title="Bản đồ di sản">{places.length} địa điểm quanh sông Cần Thơ và rạch Bình Thủy, mỗi điểm ghi rõ tọa độ đã được đối chiếu hay chưa.</SectionHead>
            <ul className="map-facts">
              <li><strong>2D</strong> bản đồ đường phố, nhẹ, dùng được trên mọi máy</li>
              <li><strong>3D</strong> ảnh vệ tinh nhìn nghiêng, cho máy có WebGL</li>
              <li><strong>Lọc</strong> theo nhóm đình chùa, bến chợ, nhà cổ và theo tuyến tour</li>
            </ul>
          </div>
          <div className="map-band-stage">
            <AtlasLauncher places={places} tours={tours}>
              <RouteDiagram places={places} tours={tours} />
            </AtlasLauncher>
          </div>
        </div>
      </section>

      {/* 5. Hành trình */}
      <section className="home-sec" aria-labelledby="hanh-trinh">
        <div className="wrap">
          <SectionHead id="hanh-trinh" title="Hành trình" action={{ href: '/hanh-trinh', label: 'Tất cả hành trình' }}>Tour bản đồ bay qua từng điểm, có thuyết minh dẫn nguồn. Hành trình đọc nối vài hồ sơ thành một mạch để hiểu một chủ đề từ nhiều phía.</SectionHead>
          <MapTourCards />
          {readingTours.length > 0 && (
            <ul className="reading-list" aria-label="Hành trình đọc">
              {readingTours.slice(0, 3).map(t => (
                <li key={t.id}>
                  <a href={`/hanh-trinh/${t.slug}`}>
                    <small>Hành trình đọc, {t.stop_count} chặng</small>
                    <strong>{t.title}</strong>
                    <span>{t.description}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* 6. Từ ngữ */}
      {teasers.length > 0 && (
        <section className="home-sec is-sunken" aria-labelledby="tieng-que">
          <div className="wrap">
            <SectionHead id="tieng-que" title="Tiếng quê mình" action={{ href: '/chuyen-muc/tieng-que-minh#choi', label: `Chơi trắc nghiệm ${words.length} từ` }}>Bấm vào thẻ để lật xem nghĩa. Nghĩa dẫn về mục từ gốc; câu ví dụ do ban biên soạn đặt và được ghi rõ như vậy.</SectionHead>
            <div className="word-row">{teasers.map(w => <TeaserCard key={w.id} word={w} />)}</div>
          </div>
        </section>
      )}

      {/* 7. Ký ức cộng đồng */}
      <section className="home-sec" aria-labelledby="ky-uc">
        <div className="wrap memory">
          <div className="memory-copy">
            <SectionHead id="ky-uc" title="Ký ức cộng đồng">Một cách gọi trong nhà, một lần đi chợ nổi với bà, một bài hát ru còn nhớ. Lời kể được giữ đúng giọng người kể và chỉ công bố khi có sự đồng ý.</SectionHead>
            <a className="button" href="/ong-ba-ke-chuyen">Ghi lại một lời kể</a>
            <p className="help-text">Kho chưa nhận gửi trực tuyến. Bạn có thể tạo bản nháp trên máy và giữ lại cho đến khi mục gửi được mở.</p>
          </div>
          <ol className="memory-steps">
            <li><strong>Ghi lại</strong><span>Ai kể, kể khi nào, ở đâu. Điều chưa chắc thì để trống.</span></li>
            <li><strong>Đối chiếu</strong><span>Ban biên tập tìm tư liệu để đặt lời kể vào bối cảnh, không sửa giọng người kể.</span></li>
            <li><strong>Công bố có đồng ý</strong><span>Đăng kèm nhãn “Ký ức của người kể”, tách khỏi phần dữ kiện có tư liệu.</span></li>
          </ol>
        </div>
      </section>
    </main>
  );
}
