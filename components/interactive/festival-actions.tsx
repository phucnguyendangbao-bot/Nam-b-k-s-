'use client';
import { useState } from 'react';
import { icsFor } from '@/lib/festival-format';

type Props = {
  festival: { id: string; name: string; edition: string; start: string; end: string; place_as_written: string; why: string; statusNote: string };
  url: string;
  directions?: string;
  past?: boolean;
};

/** Thêm vào lịch (.ics tạo ngay trên máy), chia sẻ liên kết, chỉ đường. Không gửi dữ liệu nào đi đâu. */
export function FestivalActions({ festival, url, directions, past = false }: Props) {
  const [copied, setCopied] = useState('');
  const addToCalendar = () => {
    try {
      const blob = new Blob([icsFor(festival, url)], { type: 'text/calendar;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${festival.id.toLowerCase()}.ics`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    } catch { setCopied('Trình duyệt chưa cho tải tệp lịch.'); }
  };
  const share = async () => {
    const data = { title: `${festival.name} · ${festival.edition}`, text: festival.why, url };
    try {
      if (navigator.share) { await navigator.share(data); return; }
      await navigator.clipboard.writeText(url);
      setCopied('Đã chép liên kết.');
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return;
      setCopied('Chưa chép được, hãy chép liên kết trên thanh địa chỉ.');
    }
    window.setTimeout(() => setCopied(''), 3200);
  };
  return (
    <div className="fx-actions">
      {!past && <button type="button" className="button outline" onClick={addToCalendar}>Thêm vào lịch</button>}
      <button type="button" className="button outline" onClick={share}>Chia sẻ</button>
      {directions && <a className="button outline" href={directions} target="_blank" rel="noreferrer">Chỉ đường<span className="sr-only"> (mở Google Maps ở thẻ mới)</span> ↗</a>}
      <span className="fx-toast" role="status" aria-live="polite">{copied}</span>
    </div>
  );
}
