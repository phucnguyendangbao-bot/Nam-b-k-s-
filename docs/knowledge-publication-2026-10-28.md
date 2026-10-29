# Đợt công bố tri thức — 28/10/2026

Chủ dự án cho phép hoàn thiện và đưa nội dung đã kiểm chứng lên website chính. Đợt này được rà từng nguồn, từng nhận định và phạm vi quyền; không công bố toàn bộ hàng đợi nghiên cứu.

| Chỉ tiêu | Số lượng |
|---|---:|
| Hồ sơ trong snapshot đủ điều kiện công bố | 32 |
| Hồ sơ mới trong đợt này | 7 |
| Lĩnh vực đã có hồ sơ | 12/12 |
| Hành trình đọc | 10, gồm 3 mới |
| Đầu mối tiếp tục là bản nháp | 22 |
| Nguồn trong registry công khai | 63 |
| Nguồn duy nhất gồm các gói nghiên cứu | 68 |

## Bảy hồ sơ

- Trầu cau trong lễ hỏi — dùng lại ID E002; phân biệt lời phỏng vấn với chú thích ảnh, truyền thuyết với niên đại.
- Tượng động vật Dốc Chùa — không quyết đoán loài vật, công năng hoặc năm phát hiện khi nguồn ghi khác nhau.
- Nguyễn Hữu Cảnh — chỉ trình bày dấu mốc hành chính năm 1698 đã đối chiếu, không mở rộng thành toàn bộ tiểu sử từ nguồn có lỗi niên đại.
- Nguyên Tiêu 2024 — hai chương trình ngày 20/02 và 24/02 giữ riêng, không dùng như lịch lễ hiện hành.
- Châu Giang–Phũm Soài — giữ rõ bản tin khảo sát 2025 và dự thảo năm 2026; không tạo tuyến tham quan từ đề xuất.
- Cần Giờ — sinh cảnh và quá trình phục hồi theo đúng thời điểm của UNESCO, FAO, UNDP.
- Tràm Chim — hồ sơ Ramsar và cảnh quan; số liệu cũ không thay hiện trạng quần thể hoặc diện tích.

Nguồn, phiên bản, locator, 21 nhận định và 49 câu trả lời có phạm vi nằm trong data/release/published-2026-10-28.json. Bốn gói nghiên cứu đầu vào giữ riêng để lần lại quyết định biên tập. Chỗ thiếu chứng cứ dùng partial/unknown, không lấp bằng suy đoán.

## Rà lại nội dung cũ

Đã đọc lại sáu nguồn về lễ hội Khmer, nghề bánh pía và Rô-băm. E027 tách nhận định về nghề khỏi chứng minh ghi danh; E013 có locator cụ thể hơn; E011 dùng cách diễn đạt sát nguồn hơn.

UNESCO hồ sơ đờn ca tài tử gặp human-verification khi đọc lại. Không vượt chặn, không coi snippet là toàn văn. Bài E018 hiện dùng [danh mục Cục Di sản văn hóa](https://dsvh.gov.vn/di-san-van-hoa-phi-vat-the-dai-dien-cua-nhan-loai-1755) để xác nhận 2013 và [bản tin Bộ VHTTDL năm 2022](https://bvhttdl.gov.vn/hoi-thi-nghe-thuat-don-ca-tai-tu-khong-gian-don-ca-tai-tubao-ton-va-phat-huy-gia-tri-dac-sac-cua-di-san-2022040516111061.htm) cho phạm vi văn hóa/kế hoạch truyền dạy. Đã bỏ mô tả kỹ thuật chưa đối chiếu lại được; ghi rõ kế hoạch chưa phải sự kiện đã xác nhận.

## Quyền tư liệu

Hai JPEG mới lấy từ trang tệp Commons đã đọc giấy phép: Cần Giờ của Tho nau (CC BY-SA3.0), Tràm Chim của trungydang (CC BY3.0). Tệp gốc không chỉnh sửa; ảnh chi tiết giữ khung đầy đủ, thẻ có thể cắt hiển thị bằng CSS. Dữ liệu ghi công/URL nguồn/URL giấy phép/thay đổi/SHA-256 được lưu và hiển thị dưới ảnh. Ảnh trầu cau public domain dùng lại asset đã rà trước, giữ chú thích chưa xác định địa phương chụp. Bốn hồ sơ còn lại chưa có ảnh phù hợp được cấp quyền; không thay bằng ảnh báo chí hoặc ảnh AI giả tư liệu.

Không thêm phát âm máy, bản thu dân gian, tọa độ hoặc tour thực địa mới. Tên địa bàn theo nguồn được giữ riêng; đơn vị hiện hành chưa đối chiếu để null. Hai tour 3D đã được chủ dự án cho mở trước đó giữ nhãn bản nháp.

## Cổng phát hành

publication-approval-2026-10-28.json nêu chính xác 7 ID bài, 3 ID hành trình và căn cứ ủy quyền. Hash raw JSON và payload ngăn thay đổi sau duyệt; hash ảnh ngăn đổi tệp; nguồn chỉ là thư mục, claim không có object nguồn đã rà, alias/địa danh không provenance, body khác sections hoặc quyền chưa duyệt đều bị chặn. Runtime cũng kiểm hash payload. Bản mẫu gốc không có quyền công bố và không được dùng làm đường tắt.

Website tiếp tục đọc snapshot qua GitHub/Vercel. Đề xuất SQL D1 chưa áp dụng; kho SQLite nghiên cứu ở thư mục cha có phạm vi riêng. 22 bản nháp được giữ vì còn thiếu toàn văn, chứng minh nội dung, quyền hoặc thẩm định phù hợp; xem danh sách việc tiếp theo trong docs/research-progress.md. Có bài ở mỗi lĩnh vực chưa có nghĩa đã bao quát hết lịch sử và văn hóa Nam Bộ.
