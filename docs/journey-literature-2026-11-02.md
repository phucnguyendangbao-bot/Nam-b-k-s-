# Thơ xưa và giọng kể hoài cổ — 02/11/2026

Yêu cầu trong chat: dùng câu văn chương hoặc điển tích xưa, gợi tinh thần *Vang bóng một thời*. Lời dẫn mới hướng về nếp sách, nếp nhà, công phu người làm nghề và dư âm bến cũ; biên soạn bằng lời mới. Sách Nguyễn Tuân được dùng làm hướng thẩm mỹ, không nhận các đoạn mới là lời văn trong sách.

## Văn bản lựa chọn

`lib/journey-literature.ts` giữ sáu đoạn thơ ngắn và hai ghi chú liên tưởng, có tác giả/tác phẩm, bản đối chiếu, vị trí, ngày đọc, quyền nguyên tác và ngữ cảnh sử dụng.

| Mục | Tác giả, văn bản | Vị trí đối chiếu | Chỗ dùng |
| --- | --- | --- | --- |
| Tiếng đò | Trần Tế Xương, *Sông Lấp* | Hai câu cuối, bản Wikisource | Trang hành trình và tour ven sông |
| Lối xưa | Bà Huyện Thanh Quan, *Thăng Long thành hoài cổ* | Câu 3–4, oldid 18342 | Tuyến dấu vết và Long Hồ–Cổ Chiên |
| Ta với ta | Nguyễn Khuyến, *Bạn đến chơi nhà* | Câu cuối, oldid 206536 | Long Tuyền và từ bến về nhà |
| Lời quê | Nguyễn Du, *Truyện Kiều* | Câu 3253–3254, oldid 205132 | Tuyến tiếng quê |
| Cầm thơ | Nguyễn Du, *Truyện Kiều* | Câu 3223–3224, cùng bản | Tuyến nếp nhà |
| Trước đèn | Nguyễn Đình Chiểu, *Lục Vân Tiên* | Hai câu đầu, bản 2082 câu, oldid 38436 | Tuyến bản in cũ và lời xưa |
| Bể dâu | Hình ảnh ở đầu *Truyện Kiều* | Câu 3–4 | Liên tưởng đổi thay trong tuyến tên đất, thủy đạo, Óc Eo |
| Tri âm | *Liệt Tử*, thiên Thang vấn | Đoạn bắt đầu 伯牙善鼓琴，鍾子期善聽 | Tuyến người thực hành và chặng đờn ca tài tử |

Nguồn văn bản trực tiếp được gắn trong từng mục trên giao diện. Các bản Hán/Nôm và thơ cổ được chọn là nguyên tác thuộc phạm vi công cộng; không sử dụng bản dịch hiện đại hoặc lời bình của người khác làm lời dẫn. Phần giải thích điển tích do ban biên soạn viết ngắn từ đoạn đã đọc. Với Liệt Tử, chỉ kể việc Bá Nha gảy đàn và Tử Kỳ hiểu ý núi, nước; không ghép thêm tình tiết tuyệt huyền từ văn bản khác.

## Cách trình bày

- Thơ trích có tên tác giả và tên tác phẩm ngay dưới câu thơ, giữ xuống dòng, chữ nghiêng và đường dẫn tới bản đối chiếu trong “Xuất xứ câu thơ”.
- Lời mới tiếp tục ghi “Lời dẫn · Nam Bộ Ký Sự”. Khi có điển tích, phần mở chú thích nêu liên tưởng và dẫn văn bản; không đổi tác giả lời mới thành tác giả cổ.
- Bộ hiển thị lấy câu thơ trực tiếp từ bản ghi đã đối chiếu; văn bản lời dẫn truyền vào không thể bị trình bày dưới tên nhà thơ thay cho câu trích.
- Ở tuyến đọc có đề từ, câu thơ xuất hiện tại điểm mở đầu; lời vào chặng của dự án đứng thành đoạn riêng. Các chặng sau giữ giọng kể riêng, câu nối theo đúng tuyến và lời kết.
- Thơ về Thăng Long, sông Vị Hoàng và tình bạn giữ nguyên ngữ cảnh văn học; chú thích nói rõ cách dùng làm đề từ, không biến thành lời chứng về địa điểm Nam Bộ. Những thực hành Khmer, Chăm và Hoa tiếp tục được đọc trong bối cảnh riêng của nguồn.

Toàn bộ 14 bộ lời vào/kết/câu nối và 47 khóa lời dẫn chặng đã chuyển từ giọng nhiều câu hỏi, hướng dẫn sang giọng kể hoài cổ. Tư liệu, bản duyệt/hash, ảnh, định vị và bản thu/cue thuyết minh không thay đổi.

## Xác minh và trạng thái trước lần deploy lại

- Bốn gói nội dung vẫn qua kiểm tra hash/nguồn, bộ test đạt 55/55.
- TypeScript và build production đạt. Lint các tệp sửa không lỗi, còn ba cảnh báo ref cleanup đã có trong tour-player.
- Chrome kiểm tra đủ 12 tuyến đọc và 2 tour ảnh: đúng văn bản thơ, tên tác giả, bản đối chiếu, nhãn lời biên soạn, các câu chuyển và lời kết; mở được chú giải ngữ cảnh, nguồn tư liệu vẫn có, không lỗi JavaScript và không tràn ngang ở 390 px. Đã xem ảnh desktop/mobile. Server kiểm tra đã dừng.
- Deploy production lên Vercel `nam-bo-ky-su` bị từ chối với thông báo nguyên văn `Not authorized` (CLI trả `deploy_failed`). Chưa có deployment mới cho phần thơ và giọng hoài cổ; chưa thay bản production trước đó. Đã dừng deploy theo chỉ dẫn của chủ dự án, không thử đăng nhập hoặc đưa mật khẩu/token/khóa vào công cụ.
- Mã mới còn trong working tree, chưa commit/push trong đợt này.

## Production sau khi thử lại theo yêu cầu

Đã deploy thành công lên Vercel `nam-bo-ky-su`. Deployment `dpl_211JBrD2pUdZfQuv5w9Me5PPThU6` báo READY, alias https://nam-bo-ky-su.vercel.app. Phiên đăng nhập sẵn có hoạt động trong lần thử lại; không nhập mật khẩu, token hoặc khóa API.

Kiểm tra lại 55/55 test và các gói nội dung đều đạt; Vercel build thành công. Chrome kiểm tra trực tiếp alias production cho đủ 12 tuyến đọc và 2 tour ảnh: đúng thơ, tác giả, bản đối chiếu, chú giải điển tích và mạch chuyển chặng; không lỗi JavaScript hoặc tràn ngang trên điện thoại. Trang chủ và `/ho-so/kenh-vinh-te-1819-1824` trả HTTP 200. Deploy từ working tree, chưa commit/push trong lần này.
