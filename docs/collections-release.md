# Nâng cấp ba chuyên mục — 27/10/2026

Giữ kiến trúc Vinext/React/D1 và bảng màu, bố cục văn hóa tối giản hiện có.

## Trải nghiệm

- Đất Nam Bộ, Nếp xưa, Tiếng quê mình có trang danh sách riêng, tìm kiếm tiếng
  Việt có/không dấu, bộ lọc chủ đề/phạm vi/loại từ và sắp xếp.
- Trang hồ sơ có mở đầu, các đoạn giải thích gắn nguồn, ảnh và giấy phép,
  tài liệu tham khảo, bài liên quan và hành trình đọc liên quan.
- Tư liệu lịch sử, thực hành có địa bàn, quan niệm dân gian và giả thuyết được
  gắn nhãn riêng. Đầu Sấu/Cái Răng không bị kết luận một nguồn gốc duy nhất.
- Từ điển có nghĩa, ngữ cảnh, ví dụ tự biên soạn, phạm vi, nguồn, giấy phép và
  trường âm thanh. Không có bản ghi được xác minh thì hiển thị trạng thái thiếu.

## Font và Unicode

Tự lưu Noto Sans/Noto Serif dạng WOFF2, gồm Vietnamese, Latin-ext và Latin,
font thường/nghiêng và giấy phép SIL OFL trong public/fonts. Chuẩn hóa NFC trước
khi hiển thị và khi nhận trường văn bản; không cam kết font hỗ trợ mọi chuỗi dấu
tách rời NFD. Thẻ chuyên mục dùng letter-spacing bình thường, line-height 1.5,
font fallback rõ ràng, không tổng hợp nét giả. Điều chỉnh tiêu đề mobile để tránh
tràn ngang khi dùng font mới.

## Nội dung và quyền

Bản chuẩn bị: 11 hồ sơ (4 địa danh/không gian, 2 phong tục, 5 mục từ), 3 đề xuất
hành trình đọc. Xem lib/editorial-bundle.json và data/provenance. Mọi mục đều có
publish=false. Hồ sơ tang lễ và các nghi thức chưa đủ chứng cứ vẫn là đầu mối nháp.

Ảnh: 4 tệp Commons, gồm 2 ảnh nhà cổ Bình Thủy, 1 ảnh chợ nổi Cái Răng và 1 ảnh
trầu cau minh họa bối cảnh. Ảnh trầu cau không chứng minh một nghi thức Nam Bộ
chuẩn. Metadata lưu tác giả, trang nguồn, giấy phép, thay đổi, kích thước và hash.
Không sử dụng ảnh báo chí. Các phần biên soạn dựa trên báo được tóm lược ngắn và
dẫn đúng phạm vi; không lưu toàn văn báo. Mục từ ghi công cộng tác viên Wiktionary,
phiên bản cố định và CC BY-SA 4.0. Ví dụ mới không được gọi là ca dao sưu tầm.

## Nhập và công bố có kiểm soát

Không ghi hoặc công bố gói mới trên GET, seed hay migration. Bàn biên tập
/quan-tri/ban-thao chỉ đọc bản chuẩn bị. Biên tập viên có quyền chọn nhập từng
mục vào nháp. Thao tác bảo toàn snapshot hồ sơ gốc, không ghi đè hồ sơ đã sửa.
Sau đó xác nhận chứng minh/ảnh/mục từ, duyệt quyền và phiên bản trước khi công bố.
Sửa nội dung, nguồn, mục từ hoặc ảnh làm mất duyệt. Migration 0002/0003 chỉ đổi
schema/chốt kiểm soát. Không thay đổi phạm vi truy cập website.

Chủ sở hữu đã phê duyệt rõ việc công bố đúng 11 bài và 3 hành trình đọc trong
cuộc trò chuyện ngày 27/10/2026. Do công cụ trình duyệt không khởi động được,
thao tác POST /api/editorial-release cho phép áp dụng đúng gói đã duyệt qua
service access của Sites, bổ sung khóa runtime ngắn hạn và checksum gói.
Thao tác kiểm tra dữ liệu khớp bản chuẩn bị, nguồn, ảnh, từ điển và chốt công bố;
không ghi đè bài đã sửa, không giả danh người dùng. Nhật ký ghi actor dịch vụ
đã được chủ sở hữu phê duyệt. GET không công bố. Khóa được gỡ sau thực thi;
biên nhận trong app_settings ngăn chạy lại. CMS duyệt từng mục vẫn hoạt động.

## Kiểm tra

- 12 test logic TypeScript và 11 test schema/chốt công bố Python.
- Kiểm tra kiểu TypeScript và build Worker trước đóng gói.
- QA trình duyệt local: trang chủ 1440/390/320 px; ba chuyên mục và toàn bộ
  bản chuẩn bị/trang bài ở 1440/390 px; tìm kiếm/bộ lọc; liên kết hành trình và
  lưu tiến độ. Kết quả và ảnh chụp lưu tại outputs/collections-qa (không đưa vào Git).
- Thử GET trang xem trước không làm thay đổi số mục công bố. Dữ liệu thử duyệt
  chỉ nằm trong D1 local; không đóng gói .wrangler/state hay bí mật .dev.vars.
- Thử thao tác release local: GET không ghi, thiếu/sai token bị chặn, sai gói
  bị chặn, đúng gói tạo biên nhận, chạy lại không ghi đè dữ liệu.

Giới hạn: chưa có ảnh tư liệu phù hợp cho mọi bài, chưa có phát âm thật được
cấp quyền và chưa có tuyến thực địa được đối chiếu. UI nói rõ các trạng thái này.

## Biên nhận công bố thực tế

Hosted hoàn tất công bố lúc 22:46 ngày 27/10/2026 (Asia/Saigon): 11 bài và
3 hành trình đọc. Checksum gói đã áp dụng:
`b2b73d38068bb7d2367ee2299acccdfab55e4ec6a55797d24f86263363ab9578`.
Biên nhận lưu tại app_settings với khóa reviewed_release:collections-2026-10-27-v1.
Khóa runtime cho thao tác công bố được gỡ sau khi hoàn tất. Báo cáo kiểm tra
HTTP hosted nằm trong outputs/collections-qa/hosted-results.json sau triển khai.
