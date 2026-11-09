/**
 * Lớp kể chuyện cho trang hồ sơ: rút những gì đã có trong lời văn để trình bày sinh động hơn.
 * Không thêm dữ kiện mới. Mọi mốc thời gian là câu trích nguyên văn từ chính hồ sơ, dẫn về đúng mục;
 * chữ được đánh dấu (năm, con số có đơn vị, tên gọi trong ngoặc kép) chỉ là cách nhấn, không đổi một chữ nào.
 */

export type NarrativeSection = { heading: string; text: string; kind: string };
export type Milestone = { year: number; label: string; quote: string; section: number; heading: string };
export type Mark = { text: string; type: 'year' | 'num' | 'term' | null };

const YEAR = /(?<![\d./–-])(1[0-9]{3}|20[0-2][0-9])(?!\d|[./]\d|\s?m²|\s?(?:km|ha|m)\b)/gu;

/**
 * Năm nói về một sự việc thì thường đi sau các từ chỉ thời điểm. Năm xuất bản của một nguồn
 * ("Báo Văn Hóa (2023)", "VOV 2019") thì không: đứng trong ngoặc ngay sau tên nguồn, hoặc ngay sau tên báo.
 */
const TIME_CUE = /(?:năm|từ|đến|tới|khoảng|mốc|cuối|đầu|giữa|trước|sau|vào|đời|thời|niên hiệu|tháng\s+\d{1,2}(?:\s+năm)?|ngày\s+\d{1,2}[/-]\d{1,2}[/-]|\d{1,2}[/-]\d{1,2}[/-]|[–-])\s*$/iu;
const SOURCE_CUE = /(?:Báo|VOV|MIA|Nhân Dân|Văn Hóa|Văn hóa|Tuổi Trẻ|Thanh Niên|Wikipedia|tạp chí|Tạp chí|sách|xuất bản|đăng|bài|in|Sài Gòn Giải Phóng|SGGP|Dân Trí|Người Lao Động|VnExpress|Pháp Luật|Lao Động|VTV|TTXVN|Vietnamplus|NXB|tr\.)\s*\(?\s*(?:năm\s*)?$/u;

function sentences(text: string) {
  return text.replace(/\s+/g, ' ').split(/(?<=[.!?…])\s+(?=[\p{Lu}“"(])/u).map(s => s.trim()).filter(Boolean);
}

/** Năm xuất bản của một nguồn: đứng trong ngoặc đơn một mình, hoặc ngay sau tên báo, tên sách. */
function sourceYear(text: string, index: number) {
  const before = text.slice(Math.max(0, index - 40), index), after = text.slice(index + 4, index + 6);
  const inCitation = /^\s*[),;]/.test(after) && (/\(\s*$/.test(before) || /\([^()]{2,40},\s*$/.test(before));
  return (inCitation && !/năm\s*\(?\s*$/.test(before)) || SOURCE_CUE.test(before);
}

/** Năm có phải mốc của sự việc (không phải năm xuất bản của nguồn) hay không. */
function eventYear(sentence: string, index: number) {
  const before = sentence.slice(Math.max(0, index - 40), index);
  if (/\(\s*$/.test(before) && !/năm\s*$/.test(before)) return false;   // "(2021)": năm của nguồn
  if (SOURCE_CUE.test(before)) return false;
  return TIME_CUE.test(before);
}

function clip(sentence: string, at: number, max = 190) {
  if (sentence.length <= max) return sentence;
  const start = Math.max(0, Math.min(at - 70, sentence.length - max));
  let s = sentence.slice(start, start + max);
  if (start > 0) s = '… ' + s.replace(/^\S*\s/, '');
  if (start + max < sentence.length) s = s.replace(/\s\S*$/, '') + ' …';
  return s;
}

/**
 * Các mốc thời gian nhắc trong bài, mỗi năm một mốc (lấy câu đầu tiên nhắc tới), xếp theo năm.
 * Chỉ trả về khi bài có từ ba mốc trở lên: ít hơn thì một dòng thời gian không kể thêm được gì.
 */
export function milestones(list: NarrativeSection[], limit = 10): Milestone[] {
  const byYear = new Map<number, Milestone>();
  list.forEach((s, section) => {
    if (s.kind === 'editorial_note') return;
    for (const sentence of sentences(s.text)) {
      for (const m of sentence.matchAll(YEAR)) {
        const year = Number(m[1]);
        if (year < 1000 || year > 2030 || byYear.has(year) || !eventYear(sentence, m.index ?? 0)) continue;
        byYear.set(year, { year, label: String(year), quote: clip(sentence, m.index ?? 0), section, heading: s.heading });
      }
    }
  });
  const all = [...byYear.values()].sort((a, b) => a.year - b.year);
  if (all.length < 3) return [];
  if (all.length <= limit) return all;
  // Giữ mốc đầu, mốc cuối và rải đều phần giữa để dòng thời gian vẫn trải hết quãng bài kể.
  const pick = new Set<number>([0, all.length - 1]);
  for (let i = 1; pick.size < limit; i++) pick.add(Math.round((i * (all.length - 1)) / (limit - 1)));
  return [...pick].sort((a, b) => a - b).map(i => all[i]);
}

const MARK = new RegExp([
  '(“[^”]{2,48}”)',                                                                   // tên gọi trong ngoặc kép
  '((?<![\\d.,])\\d{1,3}(?:[.,]\\d{3})*(?:,\\d+)?\\s?(?:m²|km²|km|ha|mét|cây số|tấn|héc-ta|gian|cột|ngôi|bậc)(?![\\p{L}]))', // con số có đơn vị
  '((?<![\\d./–-])(?:1[0-9]{3}|20[0-2][0-9])(?!\\d|[./]\\d))',                           // năm
].join('|'), 'gu');

/** Chia đoạn văn thành các mẩu để nhấn: tên gọi trong ngoặc kép, con số có đơn vị, năm của sự việc. */
export function markText(text: string): Mark[] {
  const out: Mark[] = [];
  let last = 0;
  for (const m of text.matchAll(MARK)) {
    const i = m.index ?? 0;
    const type: Mark['type'] = m[1] ? 'term' : m[2] ? 'num' : 'year';
    // Trong lời văn: tô mọi năm trừ năm xuất bản của nguồn ("Báo Văn Hóa (2023)", "VOV 2019").
    if (type === 'year' && sourceYear(text, i)) continue;
    if (i > last) out.push({ text: text.slice(last, i), type: null });
    out.push({ text: m[0], type });
    last = i + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), type: null });
  return out;
}

/** Đoạn văn của một mục: lời văn gốc giữ nguyên, chỉ tách theo dòng trống. */
export function paragraphs(text: string) {
  return text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
}

/** Lời dẫn khi giọng kể đổi giữa hai mục: người đọc biết mình đang bước từ tư liệu sang giả thuyết, sang lời kể. */
export const voiceShift: Record<string, string> = {
  documented_history: 'Sang phần có tư liệu: điều các nguồn ghi lại.',
  observed_practice: 'Sang phần thực hành: điều người ta làm, được nguồn mô tả.',
  folk_belief: 'Sang phần quan niệm dân gian: điều cộng đồng tin, không phải kết luận khoa học.',
  hypothesis: 'Sang phần giả thuyết: các nguồn chưa thống nhất.',
  explanation: 'Sang phần giải thích theo nguồn.',
  editorial_note: 'Ghi chú của ban biên tập.',
  legend: 'Sang phần truyền thuyết: chuyện kể, không phải sử liệu.',
  anecdote: 'Sang phần giai thoại: chuyện được kể lại, khó kiểm chứng.',
  community_memory: 'Sang phần ký ức của người kể.',
};

/** Vị trí đặt ảnh tư liệu xen giữa các mục: rải đều, không đặt sau mục cuối, không hai ảnh liền nhau nếu đủ chỗ. */
export function interleave(sectionCount: number, imageCount: number): Map<number, number[]> {
  const slots = new Map<number, number[]>();
  if (!sectionCount || !imageCount) return slots;
  const gaps = Math.max(1, sectionCount - 1);
  for (let k = 0; k < imageCount; k++) {
    const after = Math.min(gaps - 1, Math.floor(((k + 1) * gaps) / (imageCount + 1)));
    slots.set(after, [...(slots.get(after) ?? []), k]);
  }
  return slots;
}
