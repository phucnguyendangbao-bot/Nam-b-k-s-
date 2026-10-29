import type { HeritagePlace, PlaceTour } from '@/lib/heritage-places';

/** Sơ đồ thứ tự chặng của từng tour, kiểu sơ đồ tuyến: không theo tỉ lệ, không phải lộ trình. */
export function RouteDiagram({ places, tours }: { places: HeritagePlace[]; tours: PlaceTour[] }) {
  return (
    <figure className="rd">
      {tours.map(t => (
        <div className="rd-tour" key={t.slug}>
          <p className="rd-title"><a href={`/hanh-trinh/${t.slug}`}>{t.title}</a></p>
          <ol className="rd-line">
            {t.stopIds.map((id, i) => {
              const p = places.find(x => x.id === id);
              if (!p) return null;
              const leg = t.legs[i];
              return (
                <li key={id} className={leg ? (leg.traced ? 'to-river' : 'to-walk') : 'is-last'}>
                  <a href={`/ban-do?diem=${encodeURIComponent(id)}`}>
                    <b aria-hidden="true">{i + 1}</b>
                    <span>{p.name}<span className="sr-only">, chặng {i + 1}{leg ? (leg.traced ? '; chặng sau đi ghe theo sông' : '; chặng sau đi bộ') : ''}</span></span>
                  </a>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
      <figcaption>Sơ đồ thứ tự chặng, không theo tỉ lệ. Nét sóng là chặng đi ghe theo sông, nét đứt là chặng đi bộ.</figcaption>
    </figure>
  );
}
