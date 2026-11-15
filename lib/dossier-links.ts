import { publicContents, type Row } from './static-data';
import { nfc, parseSections } from './editorial-model';

/**
 * Sợi dây nối các hồ sơ: cùng nơi chốn, cùng thời kỳ, cùng nhân vật.
 * Chỉ dựa vào dữ liệu đã duyệt (địa bàn ghi trong hồ sơ, năm của sự việc trong bài, tên người được nhắc),
 * không suy diễn thêm. "Nam Bộ" chung chung không tính là cùng nơi.
 */

const PLACES: { name: string; keys: string[] }[] = [
  { name: 'Cần Thơ', keys: ['cần thơ', 'cái răng', 'bình thủy', 'ninh kiều', 'phong điền', 'long tuyền', 'đầu sấu', 'trấn giang'] },
  { name: 'An Giang', keys: ['an giang', 'châu đốc', 'tịnh biên', 'trà sư', 'óc eo', 'ba thê', 'núi sam', 'châu phong', 'vĩnh tế'] },
  { name: 'Sóc Trăng', keys: ['sóc trăng', 'mahatup', 'chùa dơi'] },
  { name: 'Vĩnh Long', keys: ['vĩnh long', 'long hồ', 'mang thít', 'cai cường'] },
  { name: 'Hậu Giang', keys: ['hậu giang', 'phụng hiệp', 'ngã bảy', 'xà no'] },
  { name: 'Kiên Giang', keys: ['kiên giang', 'u minh', 'hà tiên'] },
  { name: 'Đồng Tháp', keys: ['đồng tháp', 'tràm chim'] },
  { name: 'Bạc Liêu', keys: ['bạc liêu'] },
  { name: 'Tây Ninh', keys: ['tây ninh', 'trảng bàng'] },
  { name: 'Bến Tre', keys: ['bến tre', 'ba tri'] },
  { name: 'Đồng Nai – Bình Dương', keys: ['đồng nai', 'bình dương', 'tân uyên', 'dốc chùa', 'biên hòa'] },
  { name: 'Sài Gòn – Gia Định', keys: ['sài gòn', 'gia định', 'chợ lớn', 'tp.hcm', 'hồ chí minh', 'cần giờ', 'cần giuộc'] },
];

const ERAS: { id: string; name: string; from: number; to: number; roman: string[] }[] = [
  { id: 'co', name: 'Trước thế kỷ XVII', from: 0, to: 1599, roman: ['thế kỷ xvi', 'thế kỷ xv', 'óc eo', 'phù nam'] },
  { id: 'mo-dat', name: 'Thời mở đất, thế kỷ XVII–XVIII', from: 1600, to: 1801, roman: ['thế kỷ xvii', 'thế kỷ xviii', 'khẩn hoang'] },
  { id: 'nguyen', name: 'Nửa đầu thế kỷ XIX', from: 1802, to: 1861, roman: ['đầu thế kỷ xix'] },
  { id: 'phap', name: 'Thời Pháp thuộc, 1862–1945', from: 1862, to: 1944, roman: ['đầu thế kỷ xx', 'kinh xáng', 'kênh xáng'] },
];

const PEOPLE: { name: string; keys: string[] }[] = [
  { name: 'Nguyễn Hữu Cảnh', keys: ['nguyễn hữu cảnh', 'nguyễn hữu kính'] },
  { name: 'Nguyễn Đình Chiểu', keys: ['nguyễn đình chiểu', 'đồ chiểu'] },
  { name: 'Thoại Ngọc Hầu', keys: ['thoại ngọc hầu', 'nguyễn văn thoại'] },
  { name: 'Trịnh Hoài Đức', keys: ['trịnh hoài đức'] },
  { name: 'Huỳnh Tịnh Của', keys: ['huỳnh tịnh của'] },
  { name: 'Trương Vĩnh Ký', keys: ['trương vĩnh ký'] },
  { name: 'Cao Văn Lầu', keys: ['cao văn lầu', 'sáu lầu'] },
  { name: 'Phan Thanh Giản', keys: ['phan thanh giản'] },
  { name: 'Lê Văn Duyệt', keys: ['lê văn duyệt'] },
  { name: 'Sơn Nam', keys: ['sơn nam'] },
];

const YEAR = /(?<![\d./–-])(1[0-9]{3})(?!\d|[./]\d)/gu;

type Facts = { row: Row; places: Set<string>; eras: Map<string, number>; people: Set<string> };

const lower = (s: unknown) => nfc(String(s ?? '')).toLowerCase();

function factsOf(row: Row): Facts {
  // "Bản in Sài Gòn" là nơi in sách, không phải nơi của câu chuyện.
  const area = String(row.historical_area ?? '').startsWith('Bản in') ? '' : row.historical_area;
  const where = lower(`${area} ${row.title}`);
  const text = lower([row.title, row.introduction, row.summary, ...parseSections(row.sections_json ?? '[]').filter(s => s.kind !== 'editorial_note').map(s => `${s.heading} ${s.text}`), row.body].join(' '));
  const places = new Set(PLACES.filter(p => p.keys.some(k => where.includes(k))).map(p => p.name));
  const eras = new Map<string, number>();
  for (const m of text.matchAll(YEAR)) {
    const y = Number(m[1]);
    const e = ERAS.find(x => y >= x.from && y <= x.to);
    if (e && y >= 1000) eras.set(e.id, (eras.get(e.id) ?? 0) + 1);
  }
  for (const e of ERAS) if (e.roman.some(k => new RegExp(`${k}(?![ivx])`, 'u').test(where))) eras.set(e.id, (eras.get(e.id) ?? 0) + 3);
  // Với mục từ và tục ngữ, năm trong bài là năm của sách nguồn, không phải thời của sự việc.
  if (['dialect', 'proverb'].includes(row.content_kind)) eras.clear();
  const people = new Set(PEOPLE.filter(p => p.keys.some(k => text.includes(k))).map(p => p.name));
  return { row, places, eras, people };
}

let cache: Promise<Facts[]> | null = null;
const allFacts = () => (cache ??= publicContents().then(rows => rows.map(factsOf)));

/** Thời kỳ chính của hồ sơ: thời được nhắc nhiều nhất, cần ít nhất hai lần để khỏi bắt nhầm một năm lẻ. */
function mainEra(f: Facts) {
  const [id, n] = [...f.eras.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];
  return id && n >= 2 ? ERAS.find(e => e.id === id)! : null;
}

export type DossierLink = { slug: string; title: string; note: string; image?: string };
export type Thread = { kind: 'place' | 'time' | 'person'; label: string; items: DossierLink[]; more?: { href: string; label: string } };

const lead = (r: Row) => {
  const first = nfc(String(r.summary || r.introduction || '')).split(/(?<=[.!?])\s/)[0] ?? '';
  return first.length > 110 ? `${first.slice(0, 106).replace(/\s+\S*$/, '')}…` : first;
};
const link = (r: Row, note: string): DossierLink => ({ slug: r.slug, title: nfc(r.title), note, image: r.image_url || undefined });

export async function dossierThreads(id: string, exclude: string[] = []): Promise<Thread[]> {
  const facts = await allFacts();
  const me = facts.find(f => f.row.id === id);
  if (!me) return [];
  const used = new Set<string>([id, ...exclude]);
  const others = facts.filter(f => f.row.id !== id);
  const threads: Thread[] = [];

  // Cùng nơi: lấy nơi có nhiều hồ sơ khác nhất.
  const place = [...me.places].map(p => ({ p, list: others.filter(o => o.places.has(p)) })).sort((a, b) => b.list.length - a.list.length)[0];
  if (place?.list.length) {
    const items = place.list.filter(o => !used.has(o.row.id)).slice(0, 4);
    items.forEach(o => used.add(o.row.id));
    if (items.length) threads.push({ kind: 'place', label: `Ở cùng ${place.p}`, items: items.map(o => link(o.row, nfc(o.row.historical_area ?? ''))), more: { href: `/ban-do`, label: 'Xem trên bản đồ' } });
  }

  // Cùng thời: hồ sơ có cùng thời kỳ chính, xếp theo số lần nhắc tới thời đó.
  const era = mainEra(me);
  if (era) {
    const items = others.filter(o => !used.has(o.row.id) && (o.eras.get(era.id) ?? 0) >= 2)
      .sort((a, b) => (b.eras.get(era.id) ?? 0) - (a.eras.get(era.id) ?? 0)).slice(0, 4);
    items.forEach(o => used.add(o.row.id));
    if (items.length) threads.push({ kind: 'time', label: era.name, items: items.map(o => link(o.row, lead(o.row))), more: { href: '/dong-thoi-gian', label: 'Mở dòng thời gian' } });
  }

  // Cùng nhân vật: người được nhắc trong bài; hồ sơ riêng về người đó đứng đầu.
  for (const name of me.people) {
    const own = others.find(o => o.row.content_kind === 'person' && lower(o.row.title).startsWith(lower(name)));
    const list = others.filter(o => o.people.has(name) && !used.has(o.row.id)).sort((a, b) => Number(b === own) - Number(a === own)).slice(0, 3);
    if (!list.length) continue;
    list.forEach(o => used.add(o.row.id));
    threads.push({ kind: 'person', label: `Có nhắc ${name}`, items: list.map(o => link(o.row, o === own ? 'Hồ sơ riêng về nhân vật' : lead(o.row))) });
    if (threads.filter(t => t.kind === 'person').length >= 2) break;
  }
  return threads;
}

/** Nhãn ngắn cho đầu bài: nơi, thời, người, mỗi nhãn nhảy xuống đúng sợi dây ở cuối bài. */
export async function dossierTags(id: string) {
  const me = (await allFacts()).find(f => f.row.id === id);
  if (!me) return { places: [] as string[], era: null as string | null, people: [] as string[] };
  return { places: [...me.places], era: mainEra(me)?.name ?? null, people: [...me.people] };
}
