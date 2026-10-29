import Image from 'next/image';
import { EvidenceMix, categoryTone, collectionFor } from '@/components/site';
import { BentoGrid, type BentoItem } from '@/components/bento';
import { MapPreview } from '@/components/map-preview';
import { AtlasLauncher } from '@/components/interactive/atlas-launcher';
import { StoryScroll, type StoryChapter } from '@/components/interactive/story-scroll';
import { WordExplorer } from '@/components/interactive/word-explorer';
import { nfc, topics } from '@/lib/editorial-model';
import { heritagePlaces } from '@/lib/heritage-places';
import { knowledgeCounts } from '@/lib/knowledge';
import { ensureSeed, publicContents, publicWords, stats, type Row } from '@/lib/static-data';

export const dynamic = 'force-dynamic';

/** Đầu mỗi khối: nhãn nhỏ, tiêu đề, một câu dẫn. Mỗi khối chỉ có một trọng tâm thị giác. */
function SectionIntro({ id, eyebrow, title, lede, action, center = false }: { id: string; eyebrow: string; title: string; lede?: string; action?: { href: string; label: string }; center?: boolean }) {
  return (
    <header className={`sx-head ${center ? 'is-center' : ''}`}>
      <p className="sx-eyebrow">{eyebrow}</p>
      <h2 id={id}>{title}</h2>
      {lede && <p className="sx-lede">{lede}</p>}
      {action && <a className="text-link" href={action.href}>{action.label} <span aria-hidden="true">→</span></a>}
    </header>
  );
}

const credit = (r?: Row) => (r ? `${r.image_author}, ${r.image_license}` : '');

/** Bento lĩnh vực: thứ tự và kích thước cố định theo lưới; ảnh lấy từ hồ sơ đã công bố trong đúng lĩnh vực đó. */
const bentoPlan: { domain: string; title: string; size: BentoItem['size']; imageFrom?: string; position?: string; word?: string; motif?: string; tone?: BentoItem['tone'] }[] = [
  { domain: 'kien-truc-khong-gian-song', title: 'Kiến trúc', size: 'lg', imageFrom: 'NBS-BINH-THUY' },
  { domain: 'phong-tuc-doi-song', title: 'Phong tục', size: 'tall', imageFrom: 'E001', position: '50% 40%' },
  { domain: 'le-hoi', title: 'Lễ hội', size: 'md', imageFrom: 'E013' },
  { domain: 'phuong-ngu-nam-bo', title: 'Phương ngữ', size: 'md', word: 'mần', tone: 'lily' },
  { domain: 'dia-ly-sinh-thai', title: 'Thiên nhiên', size: 'wide', imageFrom: 'KN-CAN-GIO' },
  { domain: 'am-thuc', title: 'Ẩm thực', size: 'md', imageFrom: 'E027' },
  { domain: 'lich-su-khao-co', title: 'Lịch sử', size: 'md', motif: 'arch', tone: 'dusk' },
  { domain: 'tin-nguong-ton-giao', title: 'Tín ngưỡng', size: 'md', motif: 'sun', tone: 'dusk' },
  { domain: 'van-hoc-nghe-thuat', title: 'Nghệ thuật', size: 'md', imageFrom: 'NBS-TUCNGU-18', position: '50% 20%' },
];

const featuredIds = { lead: 'NBS-CHO-NOI', withImage: 'NBS-NINH-KIEU', text: ['E020', 'E018', 'NBS-NGUYEN-HUU-CANH'] };
const storyIds: [string, string][] = [
  ['KN-CAN-GIO', 'Nơi sông gặp biển'],
  ['NBS-NINH-KIEU', 'Bến sông giữa phố'],
  ['NBS-CHO-NOI', 'Chợ họp trên nước'],
  ['NBS-BINH-THUY', 'Nếp nhà bên rạch'],
];
const vocab = ['hổng', 'bển', 'nghen', 'mần', 'bậu', 'qua', 'vầy', 'vô'];

export default async function Home() {
  await ensureSeed();
  const [items, words, numbers, domains] = await Promise.all([publicContents(), publicWords(), stats(), knowledgeCounts()]);
  const byId = new Map(items.map(i => [i.id, i]));
  const { places, tours } = heritagePlaces(items);
  const hero = byId.get('KN-TRAM-CHIM');

  const bento: BentoItem[] = bentoPlan.flatMap(p => {
    const d = domains.find(x => x.id === p.domain);
    if (!d) return [];
    const src = p.imageFrom ? byId.get(p.imageFrom) : undefined;
    return [{
      href: p.domain === 'phuong-ngu-nam-bo' ? '/tu-dien' : `/chuyen-de/${p.domain}`,
      title: p.title, text: d.description, meta: d.count ? `${d.count} hồ sơ` : 'Đang nghiên cứu nguồn', size: p.size,
      image: src?.image_url ? { src: src.image_url, credit: credit(src), position: p.position } : undefined,
      glyph: src?.image_url ? undefined : { word: p.word, motif: p.motif }, tone: p.tone,
    }];
  });
  const shown = new Set(bentoPlan.map(p => p.domain));
  const rest = domains.filter(d => !shown.has(d.id));
  bento.push({
    href: '/tri-thuc', title: 'Cả 12 lĩnh vực', size: 'wide', tone: 'deep', glyph: { motif: 'book' },
    text: rest.length ? `Còn ${rest.map(d => d.name.toLowerCase()).join(', ')}.` : 'Tra cứu theo lĩnh vực, địa bàn và cộng đồng.',
    meta: 'Mở kho tri thức',
  });

  const lead = byId.get(featuredIds.lead);
  const second = byId.get(featuredIds.withImage);
  const textStories = featuredIds.text.map(id => byId.get(id)).filter((x): x is Row => Boolean(x));
  const chapters: StoryChapter[] = storyIds.flatMap(([id, kicker]) => {
    const r = byId.get(id);
    if (!r?.image_url) return [];
    return [{ id, kicker, title: nfc(r.title), text: r.introduction || r.summary, href: `/ho-so/${r.slug}`, image: { src: r.image_url, alt: r.title, credit: credit(r) } }];
  });
  const vocabWords = vocab.map(h => words.find(w => w.headword === h)).filter(Boolean).map(w => ({ id: String(w!.id), headword: w!.headword, meaning: w!.meaning, pos: w!.pos, example: w!.example, href: w!.href }));

  return (
    <main id="main" className="home">
      {/* 1. Hero điện ảnh */}
      <section className="hx" aria-labelledby="hx-title">
        {hero?.image_url && (
          <Image className="hx-image" src={hero.image_url} alt="" fill priority fetchPriority="high" sizes="100vw" style={{ objectPosition: '60% 50%' }} />
        )}
        <div className="hx-scrim" aria-hidden="true" />
        <div className="hx-inner wrap">
          <p className="hx-eyebrow">Kho hồ sơ văn hóa có nguồn · {numbers.published} hồ sơ đã kiểm chứng</p>
          <h1 id="hx-title">Nam Bộ — <span>Miền đất của những câu chuyện.</span></h1>
          <p className="hx-sub">Khám phá lịch sử, văn hóa, con người và những ký ức tạo nên bản sắc phương Nam.</p>
          <div className="hx-actions">
            <a className="button light" href="/kham-pha">Khám phá ngay</a>
            <a className="button ghost-light" href="/ban-do">Xem bản đồ di sản</a>
          </div>
        </div>
        {hero && (
          <p className="hx-credit">
            <a href={`/ho-so/${hero.slug}`}>{nfc(hero.title)}</a> · Ảnh: {credit(hero)}
          </p>
        )}
      </section>

      {/* 2. Lĩnh vực văn hóa — Bento */}
      <section className="sx is-alt" aria-labelledby="linh-vuc">
        <div className="wrap" data-reveal>
          <SectionIntro id="linh-vuc" eyebrow="Lối vào" title="Mỗi lĩnh vực, một cách nhìn phương Nam." lede="Chọn một chủ đề để đọc các hồ sơ cùng lĩnh vực. Mỗi thẻ cho biết đã có bao nhiêu hồ sơ được kiểm chứng." />
          <BentoGrid items={bento} label="Lĩnh vực văn hóa" />
        </div>
      </section>

      {/* 3. Câu chuyện tuyển chọn */}
      {lead && (
        <section className="sx" aria-labelledby="tuyen-chon">
          <div className="wrap" data-reveal>
            <SectionIntro id="tuyen-chon" eyebrow="Tuyển chọn" title="Đọc chậm, có nguồn để lần theo." action={{ href: '/kham-pha', label: 'Tất cả hồ sơ' }} />
            <div className="fx">
              <article className="fx-lead">
                <a className="fx-lead-media" href={`/ho-so/${lead.slug}`} tabIndex={-1} aria-hidden="true">
                  {lead.image_url && <Image src={lead.image_url} alt="" width={1536} height={1024} sizes="(max-width: 900px) 100vw, 58vw" />}
                </a>
                <div className="fx-lead-body">
                  <p className="fx-kicker">{topics[lead.topic] ?? collectionFor(lead.category).name}</p>
                  <h3><a href={`/ho-so/${lead.slug}`}>{nfc(lead.title)}</a></h3>
                  <p className="fx-lede">{lead.introduction || lead.summary}</p>
                  <EvidenceMix sectionsJson={lead.sections_json} />
                  {lead.image_url && <small className="fx-credit">Ảnh: {credit(lead)}</small>}
                </div>
              </article>
              <div className="fx-side">
                {second && (
                  <article className="fx-card is-media">
                    <a className="fx-card-media" href={`/ho-so/${second.slug}`} tabIndex={-1} aria-hidden="true">
                      {second.image_url && <Image src={second.image_url} alt="" width={800} height={530} sizes="(max-width: 900px) 100vw, 30vw" />}
                    </a>
                    <p className="fx-kicker">{topics[second.topic] ?? collectionFor(second.category).name}</p>
                    <h3><a href={`/ho-so/${second.slug}`}>{nfc(second.title)}</a></h3>
                    {second.image_url && <small className="fx-credit">Ảnh: {credit(second)}</small>}
                  </article>
                )}
                {textStories.map((s, i) => (
                  <article key={s.id} className={`fx-card is-text tone-${categoryTone[collectionFor(s.category).slug]}`}>
                    <span className="fx-num" aria-hidden="true">{String(i + 2).padStart(2, '0')}</span>
                    <div>
                      <p className="fx-kicker">{topics[s.topic] ?? collectionFor(s.category).name}</p>
                      <h3><a href={`/ho-so/${s.slug}`}>{nfc(s.title)}</a></h3>
                      <p className="fx-sum">{s.summary}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. Bản đồ di sản — trình bày như một sản phẩm */}
      <section className="sx is-alt" aria-labelledby="ban-do">
        <div className="wrap" data-reveal>
          <SectionIntro id="ban-do" eyebrow="Bản đồ di sản" title="Đặt mỗi câu chuyện về đúng chỗ của nó." lede={`${places.length} điểm quanh sông Cần Thơ và rạch Bình Thủy, mỗi điểm ghi rõ tọa độ đã đối chiếu hay chưa.`} center />
          <div className="mx">
            <AtlasLauncher places={places} tours={tours}>
              <MapPreview places={places} tours={tours} />
            </AtlasLauncher>
            <ul className="mx-features">
              <li><strong>Tìm và lọc</strong><span>Tìm theo tên, lọc đình chùa, bến chợ, nhà cổ hoặc theo tuyến.</span></li>
              <li><strong>Xem từng điểm</strong><span>Ảnh có ghi công, trạng thái tọa độ, chặng trong tour.</span></li>
              <li><strong>Đọc tiếp</strong><span>Mỗi điểm dẫn về hồ sơ và nguồn tư liệu của nó.</span></li>
              <li><strong>Nhẹ trên điện thoại</strong><span>Bản đồ 2D mặc định; 3D phố và 3D vệ tinh chỉ tải khi bạn chọn.</span></li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5. Câu chuyện theo chiều cuộn */}
      {chapters.length > 1 && (
        <section className="sx" aria-labelledby="theo-dong-nuoc">
          <div className="wrap">
            <div data-reveal>
              <SectionIntro id="theo-dong-nuoc" eyebrow="Câu chuyện" title="Theo dòng nước phương Nam." lede="Bốn hồ sơ, đi từ rừng ngập mặn nơi sông ra biển đến nếp nhà bên rạch. Mỗi đoạn dẫn lại lời giới thiệu của hồ sơ đã kiểm chứng." />
            </div>
            <StoryScroll chapters={chapters} label="Theo dòng nước phương Nam" />
          </div>
        </section>
      )}

      {/* 6. Phương ngữ */}
      {vocabWords.length > 0 && (
        <section className="sx is-alt" aria-labelledby="phuong-ngu">
          <div className="wrap wx-wrap" data-reveal>
            <SectionIntro id="phuong-ngu" eyebrow="Tiếng quê mình" title="Nói như người miền Tây." lede="Chọn một từ để xem nghĩa, cách dùng và ví dụ. Nghĩa dẫn về mục từ có nguồn." action={{ href: '/tu-dien', label: `Từ điển ${words.length} mục từ` }} />
            <WordExplorer words={vocabWords} />
          </div>
        </section>
      )}

      {/* 7. Ký ức cộng đồng — phương pháp, không lời chứng thực giả */}
      <section className="sx" aria-labelledby="ky-uc">
        <div className="wrap mem" data-reveal>
          <div className="mem-copy">
            <SectionIntro id="ky-uc" eyebrow="Ký ức cộng đồng" title="Giữ lời kể, đúng giọng người kể." lede="Một cách gọi trong nhà, một lần đi chợ nổi với bà, một bài hát ru còn nhớ. Kho chưa nhận gửi trực tuyến; bạn có thể soạn bản nháp trên máy và giữ lại." />
            <div className="mem-actions">
              <a className="button" href="/ong-ba-ke-chuyen">Soạn một lời kể</a>
              <a className="text-link" href="/nguyen-tac-bien-tap">Nguyên tắc tiếp nhận <span aria-hidden="true">→</span></a>
            </div>
          </div>
          <ol className="mem-steps">
            <li><span aria-hidden="true">1</span><div><h3>Ghi lại</h3><p>Ai kể, kể khi nào, ở đâu. Điều chưa chắc thì để trống, không đoán thêm.</p></div></li>
            <li><span aria-hidden="true">2</span><div><h3>Đối chiếu</h3><p>Ban biên tập tìm tư liệu để đặt lời kể vào bối cảnh, không sửa giọng người kể.</p></div></li>
            <li><span aria-hidden="true">3</span><div><h3>Công bố khi có đồng ý</h3><p>Đăng kèm nhãn “Ký ức của người kể”, tách khỏi phần dữ kiện có tư liệu.</p></div></li>
          </ol>
        </div>
      </section>
    </main>
  );
}
