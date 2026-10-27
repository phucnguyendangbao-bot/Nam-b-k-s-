export default function NotFound() {
  return (
    <main id="main" className="wrap page nb-404">
      <p className="nb-404-code" aria-hidden="true">404</p>
      <h1>Trang này trôi đâu mất rồi.</h1>
      <p>Hồ sơ có thể chưa được đăng, hoặc đường dẫn đã đổi. Thử tìm nhanh bằng Ctrl K, hoặc về thư viện.</p>
      <a className="button" href="/kham-pha">Về thư viện</a>
    </main>
  );
}
