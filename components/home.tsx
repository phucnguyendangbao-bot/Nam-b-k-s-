import { Fragment, type CSSProperties } from 'react';
import Image from 'next/image';
import { ph } from '@/lib/media';
import { collectionFor } from '@/components/site';
import { BentoGrid, type BentoItem } from '@/components/bento';
import { MapPreview } from '@/components/map-preview';
import { AtlasLauncher } from '@/components/interactive/atlas-launcher';
import { ChapterRail } from '@/components/interactive/chapter-rail';
import { WordExplorer } from '@/components/interactive/word-explorer';
import { nfc, topics } from '@/lib/editorial-model';
import { heritagePlaces } from '@/lib/heritage-places';
import { knowledgeCounts } from '@/lib/knowledge';
import { ensureSeed, publicContents, publicWords, type Row } from '@/lib/static-data';
import { chapterAnchor, chapters, storyImages, type StoryImage } from '@/lib/story';
import { ChapterArt } from '@/components/chapter-art';
import { Track } from '@/components/interactive/track';
import { CountUp } from '@/components/interactive/count-up';
import { StoryRiver } from '@/components/interactive/story-river';
import { festivalViews } from '@/lib/festivals';
import { formatRange, daysUntil } from '@/lib/festival-format';

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

const vocab = ['hổng', 'bển', 'nghen', 'mần', 'bậu', 'qua', 'vầy', 'vô'];

/**
 * Sắc nền của từng chương (bảng màu bìa sách, tem in xưa). Chương lẻ nền sáng, chương chẵn mảng in đậm,
 * mỗi chương một sắc riêng; giữa hai chương là một dải “nước lên” chuyển dần từ sắc này sang sắc kia.
 * Mọi cặp chữ/nền đã đo: chữ nhạt nhất trên nền sáng ≥ 4,7:1, trên nền đậm ≥ 5,6:1.
 */
const scenes: Record<string, { bg: string; dark: boolean }> = {
  nuoc: { bg: '#EEF3F1', dark: false },        // xám xanh nước phù sa
  'dau-vet': { bg: '#24467A', dark: true },    // xanh chàm in
  'ben-song': { bg: '#F8EEDC', dark: false },  // vàng rơm
  'nep-nha': { bg: '#7A3424', dark: true },    // đỏ son gạch
  'mua-hoi': { bg: '#F7E9E4', dark: false },   // hồng đất nhạt
  'tieng-noi': { bg: '#3B2F5C', dark: true },  // tím mực
};
const PAPER = '#FBF9F4';
const sceneOf = (slug?: string) => (slug && scenes[slug]) || { bg: PAPER, dark: false };

export default async function Home() {
  await ensureSeed();
  const [items, words, domains] = await Promise.all([publicContents(), publicWords(), knowledgeCounts()]);
  const festivals = await festivalViews(items);
  const nextFest = festivals.filter(f => f.time !== 'past').sort((a, b) => a.start.localeCompare(b.start))[0];
  const byId = new Map(items.map(i => [i.id, i]));
  const { places, tours } = heritagePlaces(items);

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

  const vocabWords = vocab.map(h => words.find(w => w.headword === h)).filter(Boolean).map(w => ({ id: String(w!.id), headword: w!.headword, meaning: w!.meaning, pos: w!.pos, example: w!.example, href: w!.href }));
  const vocabIds = new Set(vocabWords.map(w => w.id));
  const hero = storyImages.prologue;
  const story = chapters.map(c => ({ ...c, rows: c.ids.map(id => byId.get(id)).filter((x): x is Row => Boolean(x)) }));
  const total = story.reduce((n, c) => n + c.rows.length, 0);
  const usedImages = new Set<string>();

  return (
    <main id="main" className="home is-story">
      <StoryRiver />
      {/* Mở đầu */}
      <section className="hx" aria-labelledby="hx-title">
        <Image className="hx-image" src={hero.url} alt="" fill priority fetchPriority="high" sizes="100vw" quality={85} style={{ objectPosition: hero.position }} />
        <div className="hx-scrim" aria-hidden="true" />
        <div className="hx-inner wrap">
          <p className="hx-eyebrow"><span>Sáu chương · <CountUp to={total} /> hồ sơ đã kiểm chứng</span></p>
          <h1 id="hx-title">Nam Bộ — <span>Miền đất của những câu chuyện.</span></h1>
          <p className="hx-sub">Khám phá lịch sử, văn hóa, con người và những ký ức tạo nên bản sắc phương Nam.</p>
          <div className="hx-actions">
            <a className="button light" href="#chuong-1">Bắt đầu đọc</a>
            <a className="button ghost-light" href="/ban-do">Xem bản đồ di sản</a>
          </div>
        </div>
        {/* Bảng lướt nhanh (theo ghi chú tay 14/11): bốn lối vào hay dùng ngay trong màn đầu, mỗi ô một con số đo được. */}
        <nav className="hx-quick" aria-label="Lướt nhanh">
          <a href="/lich-le-hoi" className="hx-q">
            <span className="hx-q-k">Lễ hội</span>
            {nextFest
              ? <><strong>{nextFest.name}</strong><span>{formatRange(nextFest.start, nextFest.end)}{daysUntil(nextFest.start) > 0 ? ` · còn ${daysUntil(nextFest.start)} ngày` : ' · đang diễn ra'}</span></>
              : <><strong>Lịch lễ hội</strong><span>Ngày có nguồn công bố</span></>}
          </a>
          <a href="/ban-do" className="hx-q">
            <span className="hx-q-k">Bản đồ</span><strong>{places.length} điểm di sản</strong><span>{places.filter(p => p.festivals?.some(f => f.time !== 'past')).length > 0 ? `${places.filter(p => p.festivals?.some(f => f.time !== 'past')).length} điểm có lễ sắp tới · lọc theo nhóm` : 'Lọc theo nhóm, mở tour 3D'}</span>
          </a>
          <a href="/hanh-trinh" className="hx-q">
            <span className="hx-q-k">Hành trình</span><strong>{tours.length} tuyến đi</strong><span>Quanh sông Cần Thơ và rạch Bình Thủy</span>
          </a>
          <a href="/tu-dien" className="hx-q">
            <span className="hx-q-k">Tiếng quê mình</span><strong>{words.length} mục từ</strong><span>bậu, qua, mần, hổng, nghen…</span>
          </a>
        </nav>
      </section>
      {/* Ghi công ảnh mở đầu nằm dưới ảnh, không đè lên ảnh (ghi chú tay: “bỏ xuống”). */}
      <p className="hx-credit-row wrap">{hero.caption} <a href={hero.source_url}>{hero.author}, {hero.license_name}</a></p>

      {/* Mục lục */}
      <section className="sx toc-x" aria-labelledby="muc-luc">
        <div className="wrap" data-reveal>
          <SectionIntro id="muc-luc" eyebrow="Mục lục" title="Một câu chuyện, sáu chương." lede="Đọc lần lượt từ dòng nước đến tiếng nói, hoặc chọn chương bạn muốn. Mỗi chương dẫn vào các hồ sơ đã kiểm chứng, cuối mỗi hồ sơ có lối sang bài tiếp theo." />
          <ol className="toc">
            {story.map(c => (
              <li key={c.n}>
                <a href={`#${chapterAnchor(c)}`}>
                  <span className="toc-n" aria-hidden="true">{String(c.n).padStart(2, '0')}</span>
                  <span className="toc-body"><strong>{c.name}</strong><span>{c.title}</span></span>
                  <span className="toc-count">{c.rows.length} hồ sơ</span>
                </a>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <ChapterRail items={story.map(c => ({ n: c.n, name: c.name, anchor: chapterAnchor(c) }))} />

      {story.map((c, ci) => {
        const next = story[ci + 1];
        const isWords = c.slug === 'tieng-noi';
        const list = isWords ? c.rows.filter(r => !vocabIds.has(String(r.id))) : c.rows;
        if (c.image?.sameAs) usedImages.add(c.image.sameAs);
        // Một ảnh chỉ hiện một lần trên trang: hồ sơ dùng chung ảnh với bài trước thì chỉ hiện chữ.
        const shown = list.map(r => { const u = r.image_url as string | null; const show = Boolean(u && !usedImages.has(u)); if (u) usedImages.add(u); return show; });
        const scene = sceneOf(c.slug), after = sceneOf(next?.slug);
        return (
          <Fragment key={c.n}>
          <section className={`ch ${scene.dark ? 'is-alt' : ''} ${c.image ? 'has-media' : 'is-type'}`} id={chapterAnchor(c)} data-chapter={c.n} data-scene={c.slug} style={{ '--scene': scene.bg } as CSSProperties} aria-labelledby={`${chapterAnchor(c)}-title`}>
            <div className="wrap">
              <div className="ch-top">
                <header className="ch-head" data-reveal>
                  <p className="ch-num"><span>Chương {String(c.n).padStart(2, '0')}</span>{c.name}</p>
                  <h2 id={`${chapterAnchor(c)}-title`}>{c.title}</h2>
                  <p className="ch-lede">{c.lede}</p>
                </header>
                <ChapterArt slug={c.slug} />
              </div>
              {c.image && <ChapterFigure img={c.image} />}
              {/* Một băng trượt ngang cho cả chương: thẻ có ảnh trước, thẻ chỉ có chữ sau, số thứ tự giữ nguyên. */}
              {(() => {
                const label = (r: Row) => `${c.n}.${c.ids.indexOf(r.id) + 1}`;
                const pics = list.filter((_, i) => shown[i]), texts = list.filter((_, i) => !shown[i]);
                return (
                  <Track label={`Các hồ sơ trong chương ${c.n}`}>
                    <ol className="ch-list ch-track-list" data-reveal>
                      {pics.map(r => <ChapterEntry key={r.id} row={r} label={label(r)} image />)}
                      {texts.map(r => <ChapterEntry key={r.id} row={r} label={label(r)} image={false} />)}
                    </ol>
                  </Track>
                );
              })()}
              {isWords && vocabWords.length > 0 && (
                <div className="ch-words" data-reveal>
                  <p className="ch-words-head">“Tám” tiếng mỗi ngày <a className="text-link" href="/tu-dien">Từ điển {words.length} mục từ <span aria-hidden="true">→</span></a></p>
                  <WordExplorer words={vocabWords} />
                </div>
              )}
            </div>
          </section>
          {/* Dải chuyển cảnh: nền chuyển dần sang sắc chương sau, sóng “nước lên” theo cuộn, ghe chở người đọc sang chương mới. */}
          <div className={`ch-tide ${scene.dark ? 'from-dark' : 'from-light'} ${after.dark ? 'to-dark' : 'to-light'}`} style={{ '--from': scene.bg, '--to': after.bg } as CSSProperties}>
            <div className="wrap">
              <p className="ch-next">
                {next
                  ? <a href={`#${chapterAnchor(next)}`}><span>Chương tiếp</span>{String(next.n).padStart(2, '0')} · {next.name} <span aria-hidden="true">↓</span></a>
                  : <a href="#ket"><span>Kết</span>Câu chuyện còn tiếp <span aria-hidden="true">↓</span></a>}
              </p>
            </div>
            <svg className="ch-tide-wave" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true" focusable="false">
              <path className="w2" d="M0 58 C 180 30, 360 86, 540 58 S 900 30, 1080 58 S 1350 82, 1440 52 V120 H0z" />
              <path className="w1" d="M0 74 C 200 50, 380 100, 600 74 S 980 48, 1200 76 S 1400 92, 1440 70 V120 H0z" />
            </svg>
          </div>
          </Fragment>
        );
      })}

      {/* Kết */}
      <section className="sx ket" id="ket" aria-labelledby="ket-title">
        <div className="wrap" data-reveal>
          <SectionIntro id="ket-title" eyebrow="Kết" title="Câu chuyện còn tiếp, ở đúng chỗ của nó." lede={`${places.length} điểm quanh sông Cần Thơ và rạch Bình Thủy đã được đặt lên bản đồ, mỗi điểm ghi rõ tọa độ đã đối chiếu hay chưa. Đi theo một hành trình, hoặc góp thêm một lời kể.`} center />
          <div className="mx">
            <AtlasLauncher places={places} tours={tours}>
              <MapPreview places={places} tours={tours} />
            </AtlasLauncher>
          </div>
        </div>
        <div className="wrap mem" data-reveal>
          <div className="mem-copy">
            <SectionIntro id="ky-uc" eyebrow="Ký ức cộng đồng" title="Giữ lời kể, đúng giọng người kể." lede="Một cách gọi trong nhà, một lần đi chợ nổi với bà, một bài hát ru còn nhớ. Kho chưa nhận gửi trực tuyến; bạn có thể soạn bản nháp trên máy và giữ lại." />
            <div className="mem-actions">
              <a className="button" href="/ong-ba-ke-chuyen">Soạn một lời kể</a>
              <a className="text-link" href="/hanh-trinh">Đi theo một hành trình <span aria-hidden="true">→</span></a>
            </div>
          </div>
          <ol className="mem-steps">
            <li><span aria-hidden="true">1</span><div><h3>Ghi lại</h3><p>Ai kể, kể khi nào, ở đâu. Điều chưa chắc thì để trống, không đoán thêm.</p></div></li>
            <li><span aria-hidden="true">2</span><div><h3>Đối chiếu</h3><p>Ban biên tập tìm tư liệu để đặt lời kể vào bối cảnh, không sửa giọng người kể.</p></div></li>
            <li><span aria-hidden="true">3</span><div><h3>Công bố khi có đồng ý</h3><p>Đăng kèm nhãn “Ký ức của người kể”, tách khỏi phần dữ kiện có tư liệu.</p></div></li>
          </ol>
        </div>
      </section>

      {/* Phụ lục: đọc theo lĩnh vực */}
      <section className="sx is-alt" aria-labelledby="linh-vuc">
        <div className="wrap" data-reveal>
          <SectionIntro id="linh-vuc" eyebrow="Phụ lục" title="Hoặc đọc theo lĩnh vực." lede="Cùng các hồ sơ ấy, xếp theo mười hai lĩnh vực. Mỗi thẻ cho biết đã có bao nhiêu hồ sơ được kiểm chứng." />
          <BentoGrid items={bento} label="Lĩnh vực văn hóa" />
        </div>
      </section>
    </main>
  );
}

/** Ảnh chương: ảnh minh họa của trang, luôn kèm chú thích và ghi công đầy đủ. */
function ChapterFigure({ img }: { img: StoryImage }) {
  return (
    <figure className="ch-media" data-reveal>
      <div className="ch-media-frame ph" style={ph(img.url)}>
        <Image src={img.url} alt={img.alt} width={img.width} height={img.height} sizes="(max-width: 1240px) 100vw, 1200px" quality={85} style={{ objectPosition: img.position }} />
      </div>
      <figcaption>{img.caption} Ảnh: <a href={img.source_url}>{img.author}</a>, {img.license_name}.</figcaption>
    </figure>
  );
}

/** Một hồ sơ trong chương: số thứ tự, lĩnh vực, tiêu đề, tóm tắt; ảnh tư liệu của chính hồ sơ nếu có. */
function ChapterEntry({ row: r, label, image }: { row: Row; label: string; image: boolean }) {
  const img = image ? r.image_url as string : null;
  return (
    <li className={`ch-entry ${img ? 'has-img' : 'is-text'}`}>
      {!img && <span className="ch-entry-big" aria-hidden="true">{label}</span>}
      {img && (
        <a className="ch-entry-media ph" href={`/ho-so/${r.slug}`} tabIndex={-1} aria-hidden="true" style={ph(img)}>
          <Image src={img} alt="" width={720} height={480} sizes="(max-width: 560px) 100vw, (max-width: 1100px) 50vw, 600px" />
        </a>
      )}
      <div className="ch-entry-body">
        <p className="ch-entry-kicker"><span>{label}</span>{topics[r.topic] ?? collectionFor(r.category).name}</p>
        <h3><a href={`/ho-so/${r.slug}`}>{nfc(r.title)}</a></h3>
        <p className="ch-entry-sum">{r.summary}</p>
        {img && <small className="ch-entry-credit">Ảnh: {credit(r)}</small>}
      </div>
    </li>
  );
}

