import type { FestivalOccurrence, OccurrenceStatus } from './release-model';

/** Nhãn nguồn của ngày: người đọc biết ngày đó chắc tới đâu. */
export const dateStatusLabels: Record<OccurrenceStatus, { label: string; note: string }> = {
  reported: { label: 'Đã diễn ra, có tường thuật', note: 'Ngày lấy từ bài tường thuật kỳ lễ.' },
  announced: { label: 'Theo kế hoạch đã công bố', note: 'Ngày lấy từ kế hoạch của cơ quan tổ chức; có thể còn là “dự kiến”.' },
  listed: { label: 'Có trên lịch sự kiện của Bộ', note: 'Ngày ghi trên lịch sự kiện chính thức; chưa thấy thông báo riêng của ban tổ chức.' },
  traditional: { label: 'Theo lịch truyền thống', note: 'Chưa có thông báo; ngày dương lịch do ban biên tập quy đổi từ lịch âm.' },
};

export type TimeStatus = 'upcoming' | 'ongoing' | 'past';
export const timeLabels: Record<TimeStatus, string> = { upcoming: 'Sắp diễn ra', ongoing: 'Đang diễn ra', past: 'Đã diễn ra' };

/** Ngày hôm nay theo giờ Việt Nam, dạng YYYY-MM-DD. */
export function todayInVietnam(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
export function timeStatus(o: Pick<FestivalOccurrence, 'start' | 'end'>, today = todayInVietnam()): TimeStatus {
  return o.end < today ? 'past' : o.start > today ? 'upcoming' : 'ongoing';
}
/** Số ngày từ hôm nay tới ngày bắt đầu (âm nếu đã qua). */
export function daysUntil(start: string, today = todayInVietnam()) {
  return Math.round((Date.parse(start + 'T00:00:00Z') - Date.parse(today + 'T00:00:00Z')) / 86400000);
}

const dm = (iso: string) => { const [, m, d] = iso.split('-'); return `${Number(d)}/${Number(m)}`; };
/** "22–24/11/2026", "30/5–2/6/2027", "21/1/2027". */
export function formatRange(start: string, end: string) {
  const y = (iso: string) => iso.slice(0, 4);
  if (start === end) return `${dm(start)}/${y(start)}`;
  if (y(start) !== y(end)) return `${dm(start)}/${y(start)} – ${dm(end)}/${y(end)}`;
  if (start.slice(5, 7) === end.slice(5, 7)) return `${Number(start.slice(8))}–${dm(end)}/${y(end)}`;
  return `${dm(start)}–${dm(end)}/${y(end)}`;
}
const monthNames = ['Giêng', 'Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy', 'Tám', 'Chín', 'Mười', 'Mười Một', 'Chạp'];
/** "14–16 tháng Mười năm Bính Ngọ". */
export function lunarLabel(l: FestivalOccurrence['lunar']) {
  const [d1, m1] = l.start, [d2, m2] = l.end;
  const days = d1 === d2 && m1 === m2 ? `${d1} tháng ${monthNames[m1 - 1]}` : m1 === m2 ? `${d1}–${d2} tháng ${monthNames[m1 - 1]}` : `${d1} tháng ${monthNames[m1 - 1]} – ${d2} tháng ${monthNames[m2 - 1]}`;
  return `${days} năm ${l.year}`;
}

/** "Năm Bính Ngọ" → "năm Bính Ngọ": chỉ hạ chữ đầu, giữ tên riêng. */
export const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

export function directionsUrl(p: { lat: number; lng: number }) {
  return `https://www.google.com/maps/dir/?api=1&destination=${p.lat.toFixed(6)},${p.lng.toFixed(6)}`;
}

const icsText = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
const icsDate = (iso: string, plusDays = 0) => { const d = new Date(Date.parse(iso + 'T00:00:00Z') + plusDays * 86400000); return d.toISOString().slice(0, 10).replace(/-/g, ''); };
/** Tệp lịch .ics (sự kiện cả ngày). Tạo ngay trên máy người dùng, không gửi dữ liệu đi đâu. */
export function icsFor(o: { id: string; name: string; edition: string; start: string; end: string; place_as_written: string; why: string; statusNote: string }, url: string) {
  const fold = (line: string) => line.match(/.{1,70}/gu)?.join('\r\n ') ?? line;
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Nam Bo Ky Su//Lich le hoi//VI', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
    `UID:${o.id}@nam-bo-ky-su`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`, `DTSTART;VALUE=DATE:${icsDate(o.start)}`, `DTEND;VALUE=DATE:${icsDate(o.end, 1)}`,
    fold(`SUMMARY:${icsText(`${o.name} (${lowerFirst(o.edition)})`)}`), fold(`LOCATION:${icsText(o.place_as_written)}`),
    fold(`DESCRIPTION:${icsText(`${o.why}\n${o.statusNote}\nNguồn và chi tiết: ${url}`)}`), fold(`URL:${url}`),
    'END:VEVENT', 'END:VCALENDAR', '',
  ].join('\r\n');
}
