'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main id="main" className="wrap page"><p className="eyebrow">CHƯA THỂ MỞ TRANG</p><h1>Một nhịp chờ để nối lại.</h1><p>Không thể đọc dữ liệu lúc này. Nếu bạn đang thiết lập dự án, hãy kiểm tra D1 và áp dụng migrations.</p><button className="button" onClick={reset}>Thử lại</button></main>;}
