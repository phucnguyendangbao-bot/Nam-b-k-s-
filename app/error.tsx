'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="wrap page nb-404">
      <h1>Chưa mở được trang này.</h1>
      <p>Không đọc được dữ liệu lúc này. Thử tải lại; nếu bạn đang cài đặt dự án, kiểm tra kết nối D1 và các migration.</p>
      <button className="button" onClick={reset}>Tải lại</button>
    </main>
  );
}
