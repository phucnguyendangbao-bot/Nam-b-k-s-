# Kiểm tra nền tảng tri thức — 28/10/2026

| Bước | Kết quả |
|---|---|
| `npm run knowledge:report` | 12 lĩnh vực; 25 ánh xạ; 3 mẫu nháp; 6 nhận định mẫu; 6 mốc có nguồn; 0 bài công bố mới |
| `node --test tests/*.test.mjs` | 30 kiểm thử qua |
| `python -m unittest discover -s tests -p 'test_*.py'` | 29 kiểm thử qua, chỉ dùng database tạm |
| `npm run typecheck` | Qua |
| `npm run lint` | Qua, không cảnh báo |
| `npm run build:vercel` | Qua, chạy audit tri thức trước khi build |
| `node scripts/qa-knowledge.mjs` | 270 kiểm tra qua ở 1440×1000 và 390×844 |

QA đọc 25 trang hồ sơ, 12 chuyên đề, sáu trang tri thức, sáu chuyên mục cũ, trang chủ, bản đồ và hai tour 3D. Kiểm tra API/search/sitemap không lộ mẫu nháp, tìm không dấu/tên cũ, giao bộ lọc, đổi hồ sơ trung tâm, trường phát âm để trống, tải lời kể thành tệp nháp, Unicode và tràn ngang. Bản đồ/tour được kiểm phản hồi và nội dung HTML; không tuyên bố đã khảo sát tuyến hoặc xác minh lại tọa độ thực địa.

Đã xem ảnh chụp desktop và mobile, sửa chữ tối trên thẻ trung tâm, kiểm lại màu chữ bằng trình duyệt và chụp riêng viewport để xác nhận dễ đọc. Bằng chứng cục bộ nằm trong `outputs/knowledge-qa/results.json`, `hub-viewport-390.png`, `hub-1440.png`, `links-viewport-390.png`; báo cáo audit và mẫu đầy đủ trong `outputs/knowledge/`.

SQL bổ sung chỉ được thực thi trong SQLite tạm của kiểm thử, không áp dụng vào D1 hay kho nghiên cứu. Ba nguồn mẫu chưa nhập vào registry đang vận hành; ba hồ sơ mẫu chưa có phê duyệt xuất bản, ảnh hay bản thu.
