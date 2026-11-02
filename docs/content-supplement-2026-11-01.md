# Bổ sung nội dung từ đặc tả 01/11/2026

Nguồn đầu vào: `E:/nam_bo_ky_su_content_and_ui_spec.md`. Phạm vi yêu cầu trong chat: “bổ sung nội dung”. Chỉ bổ sung dữ liệu và các nhãn cần thiết để hiển thị dữ liệu đúng; chưa thực hiện 5 task nâng cấp UI/UX trong Phần IV, chưa commit/push/deploy.

## Nội dung đã tích hợp

- 10 hồ sơ theo Phần I, thêm nhà cổ Cai Cường làm điểm dừng có hồ sơ của hành trình Long Hồ–Cổ Chiên.
- 2 mục từ có nguồn đọc được: cây bẹo/treo bẹo và lì xì. Ví dụ là câu mới của ban biên soạn, không gán cho Vương Hồng Sển hoặc Huình Tịnh Của. Không kết luận từ nguyên khi chưa đọc công trình chuyên môn.
- 15 nguồn với vị trí đoạn đã đọc, 26 nhận định, 11 mốc thời gian, 2 hành trình đọc và 9 tọa độ đề xuất do đặc tả cung cấp.
- Mỗi hồ sơ có phạm vi bài viết, nguồn từng đoạn, nhãn tư liệu/lời kể/ghi chú và liên kết vào sáu chương. Không thêm ảnh hoặc bản thu chưa có quyền.

Gói mới là `data/release/published-2026-11-01-supplement.json`; bản quyết định đi kèm khóa cả byte tệp và payload. Không sửa hai gói đã duyệt trước. Mục từ mới cần clearance riêng ghi rõ người đối chiếu, nguồn nghĩa, ví dụ biên soạn và chưa cấp quyền âm thanh. Không nới điều kiện âm thanh/tọa độ trong hồ sơ.

## Những điểm khác đặc tả sau khi đối chiếu

1. Trà Sư: trang VACNE có ngày năm 2011; dùng ID `NB-TRASU-VACNE-2011`, không lấy năm 2020 trong tên mã đề xuất. Chưa đưa con số kênh bao ngạn 14 km vào bài.
2. U Minh Thượng: danh sách chính thức Ramsar ghi ngày chỉ định 30/04/2015, site 2228. Không dùng mốc 2016 thay cho ngày chỉ định; 3.000 ha than bùn cũng không phải bằng chứng tuổi than bùn 3.000 năm. Nguồn: https://rsis.ramsar.org/sites/default/files/rsiswp_search/exports/Ramsar-Sites-annotated-summary-Viet-Nam.pdf
3. Óc Eo: chỉ xác nhận năm 1944 từ Bảo tàng Lịch sử Quốc gia; chưa khẳng định ngày 10/02 hoặc trạng thái UNESCO hiện nay.
4. Văn Thánh Miếu: Nhân Dân và Wikipedia ghi khác nhau về năm dựng bia số 1. Chưa chọn một năm làm kết luận; không ghi là đã đọc bản rập hoặc sách gốc. Mốc Tụy Văn lâu và ngày xếp hạng trên timeline được ghi rõ là theo nguồn tổng hợp.
5. Gia Định thành thông chí: bài này chỉ giới thiệu tác phẩm qua nguồn thứ cấp. Dùng “khoảng 1820” là mốc xuất bản theo nguồn, không ghép sự kiện đào kênh Vĩnh Tế vào niên đại của sách.
6. Ngã Bảy: tên các nhánh sông trong Tuổi Trẻ khác bảng đặc tả. Không khẳng định danh sách tên hay lịch di dời chưa đối chiếu; bài năm 2013 không được dùng như thông tin hiện trạng.
7. Dạ cổ hoài lang: nguồn Cinet dùng 1919, nguồn tổng hợp liệt kê các ý kiến khác. Bài và timeline ghi rõ mốc theo Cinet, không kết luận ngày rằm cụ thể, không chép lời ca, không đưa ngày sinh đang khác nhau giữa nguồn vào hồ sơ.
8. Tọa độ trong đặc tả chưa được kiểm tra bản đồ hoặc thực địa: giữ `proposed`, hiển thị nhãn riêng trên bản đồ, không gắn `geo_reviewed=1` hoặc nhận là tọa độ OpenStreetMap.

## Đầu việc tư liệu còn mở

`data/release/content-spec-pending-2026-11-01.json` giữ ba mục từ cà ràng, thèo lèo, mửng và mốc thư mục 1895–1896 ở trạng thái nháp. Chưa đọc được mục từ gốc và vị trí trang trong hai bộ từ điển mà đặc tả dẫn; trang giới thiệu sách không chứng minh nghĩa hoặc từ nguyên. Mục mửng tiếng Tày tìm thấy trên Wiktionary không phải chứng cứ cho nghĩa phương ngữ Nam Bộ.

Các URL Cục Du lịch trong đặc tả chỉ trả nội dung rỗng qua công cụ đọc, URL Viện Âm nhạc trả lỗi. Đã dùng nguồn thay thế có thể đọc và ghi đúng phạm vi `excerpt` thay vì nhận đã đọc toàn bài hoặc tư liệu gốc. Metadata quyền Wikimedia và đường dẫn mục từ vẫn được giữ khi có sử dụng phần biên soạn tương ứng.

## Kiểm tra hoàn tất

`npm run release:validate`, `npm run knowledge:validate`, `npx tsc --noEmit`, `npx eslint .` và `npm run build:vercel` đều thành công. Bộ test Node đạt 49/49. Bản production chạy tạm tại loopback trả HTTP 200 và có nội dung tương ứng cho cả 13 hồ sơ/mục từ, 2 hành trình và 4 trang tổng hợp (từ điển, bản đồ, dòng thời gian, nguồn tư liệu). Server kiểm tra đã được dừng; chưa kiểm tra giao diện bằng trình duyệt và chưa deploy ra production.
