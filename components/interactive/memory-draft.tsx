'use client';
import { useState } from 'react';
import { createMemoryDraft } from '@/lib/memory-draft';

export function MemoryDraft() {
  const [message, setMessage] = useState('');
  return <form className="kn-memory" onSubmit={event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const read = (key: string) => String(form.get(key) ?? '');
    try {
      const draft = createMemoryDraft({ title: read('title'), narrator: read('narrator'), date: read('date'), place: read('place'), text: read('text'), provenance: read('provenance'), storageConsent: form.has('storage'), publicationConsent: form.has('publication') });
      const url = URL.createObjectURL(new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json;charset=utf-8' }));
      const link = document.createElement('a'); link.href = url; link.download = 'ky-uc-ban-nhap.json'; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage('Đã tạo tệp bản nháp trên máy. Chưa gửi lên website và chưa công bố.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Chưa thể tạo bản nháp.'); }
  }}>
    <h2>Ghi lại một lời kể</h2>
    <p>Tệp chỉ được tạo trên máy của bạn. Giữ cách gọi của người kể; để trống điều chưa biết. Tránh ghi thông tin riêng tư khi chưa có sự đồng ý.</p>
    <label>Tên lời kể<input name="title" required maxLength={160} /></label>
    <div className="kn-form-pair"><label>Người kể hoặc tên được phép hiển thị<input name="narrator" maxLength={120} /></label><label>Ngày ghi lại, nếu biết<input name="date" type="date" /></label></div>
    <label>Nơi chốn theo lời kể<input name="place" maxLength={240} /></label>
    <label>Lời kể<textarea name="text" rows={7} required maxLength={12000} /></label>
    <label>Xuất xứ và điều cần đối chiếu<textarea name="provenance" rows={3} required maxLength={2000} /></label>
    <label className="check"><input name="storage" type="checkbox" required />Tôi có quyền ghi lại và lưu lời kể này thành bản nháp trên máy.</label>
    <label className="check"><input name="publication" type="checkbox" />Người kể đồng ý đề nghị công bố sau khi dự án thẩm định. Đây chưa phải phê duyệt đăng bài.</label>
    <button className="button" type="submit">Tải bản nháp JSON</button><p role="status">{message}</p>
  </form>;
}
