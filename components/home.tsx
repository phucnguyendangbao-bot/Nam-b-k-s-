import { Arrow, Ornament, collectionFor } from '@/components/site';
import { TeaserCard } from '@/components/interactive/lexicon-play';
import { Gallery, HeroSlider, UpdatesPanel, type Slide, type UpdateItem } from '@/components/interactive/heritage';
import { categories } from '@/lib/catalog';
import { all, ensureSeed, publicContents, publicTours, publicWords, stats, type Row } from '@/lib/static-data';
import { MapTourCards } from '@/components/map-tour-page';
import { mapTours } from '@/lib/map-tours';

export const dynamic = 'force-dynamic';

const weekdays = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
function calendar(iso: string) {
  const d = new Date(new Date(iso).toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  return { month: `Tháng ${d.getMonth() + 1}`, day: String(d.getDate()).padStart(2, '0'), weekday: weekdays[d.getDay()] };
}

function SectionTitle({ kicker, title, sub, light = false }: { kicker: string; title: string; sub?: string; light?: boolean }) {
  return (
    <div className={`hs-title ${light ? 'is-light' : ''}`}>
      <span className="hs-title-kicker">{kicker}</span>
      <h2>{title}</h2>
      {sub && <span className="hs-title-sub">{sub}</span>}
      <Ornament />
    </div>
  );
}

export default async function Home() {
  await ensureSeed();
  const [items, tours, words, numbers, media] = await Promise.all([
    publicContents(),
    publicTours(),
    publicWords(),
    stats(),
    all("SELECT m.url,m.caption,m.author,m.license_name,c.slug,c.title FROM media_assets m JOIN cultural_contents c ON c.id=m.content_id WHERE m.kind='image' AND m.review_status='accepted' ORDER BY m.id"),
  ]);
  const published = new Set(items.map(i => i.slug));
  const photos = media.filter(m => published.has(m.slug));
  const seen = new Set<string>();
  const order = (u: string) => (u.includes('cai-rang') ? 0 : u.includes('binh-thuy') ? 1 : 2);
  const placeSlugs = new Set(items.filter(item => item.content_kind === 'place').map(item => item.slug));
  const slides: Slide[] = [...photos].filter(p => placeSlugs.has(p.slug)).sort((a, b) => order(a.url) - order(b.url)).filter(m => (seen.has(m.url) ? false : (seen.add(m.url), true))).map(m => ({
    src: m.url, title: m.title, href: `/ho-so/${m.slug}`, credit: `Ảnh: ${m.author}, ${m.license_name}`,
  }));
  const articles = items.filter(i => i.content_kind !== 'dialect');
  const rankFeatured = (c: Row) => (c.image_url ? (String(c.image_url).includes('trau-cau') ? 1 : 0) : 2);
  const featured = [...articles].sort((a, b) => rankFeatured(a) - rankFeatured(b));
  const tabs = categories.map(c => ({ id: c.slug, label: c.name }));
  const updates: UpdateItem[] = [...items]
    .sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)))
    .map(i => ({ href: `/ho-so/${i.slug}`, title: i.title, image: i.image_url ?? undefined, tab: collectionFor(i.category).slug, ...calendar(i.updated_at) }));
    const bandPhoto = photos.find(p => p.url.includes('thuydaonguyen')) ?? photos[0];
  const mapPhoto = photos.find(p => p.url.includes('thuydaonguyen')) ?? photos[0];
  const introPhoto = photos.find(p => p.url.includes('daae')) ?? photos[0];
  const teaser = words.find(w => w.headword === 'mần') ?? words[0];
  const pinned = items.filter(i => i.geo_reviewed === 1 && i.latitude !== null).length;

  return (
    <main id="main" className="hs-home">
      <section className="hs-hero">
        <HeroSlider slides={slides} />
        <div className="hs-hero-copy">
          <p className="hs-hero-kicker">Ký sự văn hóa Nam Bộ</p>
          <h1>Đất, người và tiếng nói Nam Bộ</h1>
          <p className="hs-hero-lede">Những hồ sơ ngắn về tên đất, nếp nhà và lời ăn tiếng nói, viết từ nguồn có thật và chỉ rõ chỗ để bạn tự kiểm tra.</p>
          <div className="hs-hero-actions">
            <a className="button light" href="/kham-pha">Khám phá hồ sơ</a>
            <a className="hs-hero-link" href="/hanh-trinh">Đọc theo hành trình</a>
          </div>
        </div>
      </section>

      <section className="kn-home"><div className="hs-wrap"><p className="eyebrow">Bảo tàng số · Từ điển văn hóa · Bản đồ tri thức</p><h2>Mười hai lối vào Nam Bộ</h2><p>Tra cứu theo lĩnh vực, lần theo tên đất cũ, đọc các mốc có nguồn và nối những hồ sơ liên quan. Kho hiện có tập trung ở Tây Nam Bộ, đang mở rộng tư liệu về Đông Nam Bộ và các cộng đồng.</p><a className="button" href="/tri-thuc">Mở kho tri thức <Arrow /></a></div></section>

      <section className="hs-intro">
        <div className="hs-wrap hs-intro-grid">
          <div className="hs-intro-body">
            <SectionTitle kicker="Về kho hồ sơ" title="Nam Bộ Ký Sự" />
            <p className="hs-lead">Một kho hồ sơ về những tên đất, nếp nhà và lời ăn tiếng nói của miền sông nước, viết từ văn bản hành chính, bài nghiên cứu, báo chí và từ điển mở.</p>
            <p className="hs-body">Dữ kiện có tư liệu được tách khỏi giả thuyết, lời kể và quan niệm dân gian. Điều chưa rõ được ghi là chưa rõ; cách làm của một gia đình không được trình bày như khuôn mẫu cho cả vùng.</p>
            <dl className="hs-facts">
              <div><dt>Hồ sơ đã kiểm chứng</dt><dd>{numbers.published}</dd></div>
              <div><dt>Chờ kiểm chứng</dt><dd>{numbers.pending}</dd></div>
              <div><dt>Nguồn tư liệu</dt><dd>{numbers.sources}</dd></div>
            </dl>
            <a className="hs-more" href="/ve-du-an">Về dự án</a>
          </div>
          {introPhoto && (
            <figure className="hs-intro-photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={introPhoto.url} alt={introPhoto.caption ?? introPhoto.title} loading="lazy" />
              <figcaption><a href={`/ho-so/${introPhoto.slug}`}>{introPhoto.title}</a><small>Ảnh: {introPhoto.author}, {introPhoto.license_name}</small></figcaption>
            </figure>
          )}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="hs-band" style={bandPhoto ? { backgroundImage: `url(${bandPhoto.url})` } : undefined}>
          <div className="hs-wrap">
            <div className="hs-band-head">
              <SectionTitle kicker="Hồ sơ" title="Ký sự" sub="Đọc chậm, có nguồn để lần theo" light />
              <blockquote className="hs-quote is-light">
                <p>Từ chợ nổi Cái Răng, nhà cổ Bình Thủy đến những giả thuyết về tên đất Đầu Sấu: mỗi hồ sơ trình bày điều nguồn thực sự nói, và chỉ ra chỗ còn để ngỏ.</p>
              </blockquote>
            </div>
            <Gallery label="Các hồ sơ nổi bật">
              {featured.map(c => (
                <a key={c.id} href={`/ho-so/${c.slug}`} className="hs-frame">
                  <span className="hs-frame-media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {c.image_url ? <img src={c.image_url} alt="" loading="lazy" /> : <span className="hs-frame-blank">{collectionFor(c.category).name}</span>}
                  </span>
                  <span className="hs-frame-caption">{c.title}</span>
                </a>
              ))}
            </Gallery>
          </div>
        </section>
      )}

      <section className="hs-news">
        <div className="hs-wrap">
          <SectionTitle kicker="Sổ ghi" title="Mới cập nhật" sub="Các hồ sơ vừa được duyệt và đăng" />
          <UpdatesPanel tabs={tabs} items={updates} />
          <p className="hs-news-more"><a className="hs-more" href="/kham-pha">Xem tất cả hồ sơ <span aria-hidden="true">»</span></a></p>
        </div>
      </section>

      {teaser && (
        <section className="hs-lexicon">
          <div className="hs-wrap hs-lexicon-grid">
            <div>
              <SectionTitle kicker="Lời ăn tiếng nói" title="Tiếng quê" sub="Từ địa phương có nguồn ghi chép" light />
              <p className="hs-lexicon-text">Lật thẻ để xem nghĩa, rồi thử sức với {words.length} câu trắc nghiệm. Nghĩa của mỗi từ dẫn về mục từ gốc, câu ví dụ được ghi rõ là do ban biên soạn đặt.</p>
              <a className="button" href="/chuyen-muc/tieng-que-minh#choi">Mở bộ thẻ và trắc nghiệm</a>
            </div>
            <TeaserCard word={teaser} />
          </div>
        </section>
      )}

      <section className="hs-tours">
        <div className="hs-wrap">
          <SectionTitle kicker="Đi theo" title="Hành trình" sub="Bay qua di sản trên bản đồ 3D, có chú thích và thuyết minh" />
          <MapTourCards />
          {tours.length > 0 && (
            <>
              <h3 className="hs-tours-sub">Hành trình đọc</h3>
              <div className="hs-tour-grid">
                {tours.map((t: Row) => (
                  <a key={t.id} href={`/hanh-trinh/${t.slug}`} className="hs-tour">
                    <span className="hs-tour-count">{t.stop_count} chặng</span>
                    <h3>{t.title}</h3>
                    <p>{t.description}</p>
                    <span className="hs-more">Bắt đầu đọc <span aria-hidden="true">»</span></span>
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="hs-mapband" style={mapPhoto ? { backgroundImage: `url(${mapPhoto.url})` } : undefined}>
        <div className="hs-mapbox">
          <h2>Bản đồ</h2>
          <p className="hs-mapbox-sub">Phạm vi tư liệu</p>
          <ul>
            <li>Khởi đầu: <b>Cần Thơ, Hậu Giang, Sóc Trăng</b> (theo địa giới trước sáp nhập)</li>
            <li>Địa điểm đã đối chiếu tọa độ: <b>{pinned}</b></li>
            <li>Tour bản đồ 3D: <b>{mapTours.length}</b>, hành trình đọc: <b>{tours.length}</b>, nguồn tư liệu: <b>{numbers.sources}</b></li>
          </ul>
          <div className="hs-mapbox-actions">
            <a className="button dark" href="/ban-do">Xem bản đồ</a>
            {mapTours[0] ? <a className="button dark" href={`/hanh-trinh/${mapTours[0].slug}`}>Mở tour 3D</a> : <a className="button dark" href="/hanh-trinh?loai=digital">Chọn hành trình đọc</a>}
          </div>
          <a className="button gold" href="/ky-uc-cong-dong">Gửi một ký ức</a>
          {mapPhoto && <small className="hs-mapband-credit">Ảnh nền: {mapPhoto.author}, {mapPhoto.license_name}</small>}
        </div>
      </section>
    </main>
  );
}
