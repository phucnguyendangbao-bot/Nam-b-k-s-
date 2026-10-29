'use client';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { HeritagePlace, PlaceTour } from '@/lib/heritage-places';

const Atlas = dynamic(() => import('./heritage-atlas').then(m => m.HeritageAtlas), {
  ssr: false,
  loading: () => <div className="atlas-placeholder" role="status"><span className="nb-loading"><span /><span /><span /><b>Đang tải bản đồ…</b></span></div>,
});

/** Chỉ tải thư viện bản đồ khi người đọc bấm mở, để trang chủ nhẹ và nhanh. */
export function AtlasLauncher({ places, tours, children }: { places: HeritagePlace[]; tours: PlaceTour[]; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  if (open) return <Atlas places={places} tours={tours} compact />;
  return (
    <div className="atlas-launch">
      {children}
      <div className="atlas-launch-actions">
        <button type="button" className="button" onClick={() => setOpen(true)}>Mở bản đồ tại đây</button>
        <a className="button outline" href="/ban-do">Xem trang bản đồ</a>
      </div>
    </div>
  );
}
