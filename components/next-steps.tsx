import { chapterAnchor, chapters } from '@/lib/story';
import { heritagePlaces } from '@/lib/heritage-places';
import { mapTours } from '@/lib/map-tours';
import { publicContents, publicTours } from '@/lib/static-data';

/** Số hành trình đúng như trang /hanh-trinh hiển thị: tour bản đồ + hành trình đọc. */
export async function journeyTotals() {
  const reading = (await publicTours()).length;
  return { map: mapTours.length, reading, total: mapTours.length + reading };
}

/**
 * Lối đi tiếp ở cuối mỗi trang tổng hợp (chuyên mục, chuyên đề, kho tri thức, lịch lễ hội, từ điển…).
 * Một xương sống: câu chuyện sáu chương ở trang chủ. Khối này chỉ ra chương nào chứa các hồ sơ của trang,
 * rồi thêm Bản đồ và Hành trình. Tối đa bốn lối, không thành một kho liên kết nữa.
 */
export async function NextSteps({ ids = [], title = 'Đọc tiếp từ đây' }: { ids?: string[]; title?: string }) {
  const [items, journeys] = await Promise.all([publicContents(), journeyTotals()]);
  const places = heritagePlaces(items).places.length;
  const here = new Set(ids);
  const found = chapters
    .map(c => ({ c, n: c.ids.filter(id => here.has(id)).length }))
    .filter(x => x.n > 0)
    .sort((a, b) => b.n - a.n || a.c.n - b.c.n)
    .slice(0, 2)
    .sort((a, b) => a.c.n - b.c.n);
  const first = chapters[0];
  return (
    <section className="next-steps" aria-labelledby="next-steps-title">
      <p className="eyebrow">Đi tiếp</p>
      <h2 id="next-steps-title">{title}</h2>
      <ul>
        {found.length ? found.map(({ c, n }) => (
          <li key={c.n} className="is-story">
            <a href={`/#${chapterAnchor(c)}`}>
              <small>Đọc trong câu chuyện</small>
              <strong>Chương {c.n} · {c.name}</strong>
              <span>{n === c.ids.length ? `Cả ${n} hồ sơ của chương có ở trang này` : `${n} hồ sơ ở trang này nằm trong chương`}</span>
            </a>
          </li>
        )) : (
          <li className="is-story">
            <a href={`/#${chapterAnchor(first)}`}>
              <small>Đọc trong câu chuyện</small>
              <strong>Bắt đầu từ Chương 1 · {first.name}</strong>
              <span>Sáu chương nối các hồ sơ đã kiểm chứng</span>
            </a>
          </li>
        )}
        <li>
          <a href="/ban-do">
            <small>Bản đồ di sản</small>
            <strong>{places} điểm trên bản đồ</strong>
            <span>Xem hồ sơ nằm ở đâu</span>
          </a>
        </li>
        <li>
          <a href="/hanh-trinh">
            <small>Hành trình</small>
            <strong>{journeys.total} hành trình</strong>
            <span>{journeys.reading} hành trình đọc · {journeys.map} tour bản đồ</span>
          </a>
        </li>
      </ul>
    </section>
  );
}
