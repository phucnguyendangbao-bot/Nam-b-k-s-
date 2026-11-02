# Trải nghiệm hành trình — 02/11/2026

Phạm vi: hoàn thiện hành trình, tăng liên kết giữa nội dung, ảnh thật và chuyển động. Giữ nguyên trạng thái duyệt của dữ kiện và tuyến nháp; không sửa các gói nội dung đã khóa hash.

## Trải nghiệm

- Trang `/hanh-trinh` có ảnh mở đầu toàn khung, nhóm tour ảnh/âm thanh/bản đồ và các hành trình đọc có ảnh xem trước. Liên kết đọc giữ nguyên slug.
- Hai tour Cần Thơ và Long Tuyền mở bằng ảnh thật; chọn từng khung trong dải ảnh để chuyển điểm dừng. Bản đồ chỉ khởi tạo khi chọn “Khám phá bản đồ”, giải phóng canvas khi quay lại ảnh.
- Chuyển ảnh chỉ bắt đầu khi ảnh mới giải mã xong, giữ khung ảnh cũ nếu mạng lỗi. Chuyển cảnh dùng opacity và transform; chế độ giảm chuyển động tắt chuyển cảnh và chuyển động ảnh.
- Tiến độ lưu cục bộ theo từng hành trình, có nút đọc/nghe tiếp; dữ liệu cũ không trỏ được tới chặng đã xóa hoặc chặng thuộc tuyến khác. URL `#chang-N` của tour bản đồ và `?chang=<stop_id>` của hành trình đọc tiếp tục hoạt động.
- Tạm dừng thuyết minh giữ thời điểm phát để nghe tiếp. Không còn bước phát thử rồi dừng có thể vô tình dừng chính bản thuyết minh trên điện thoại. Phát lỗi có thông báo và cho tiếp tục đọc thay vì im lặng nhảy chặng.
- Phím mũi tên chỉ điều khiển tour khi focus ở trong tour, không chiếm điều hướng của toàn trang. Mở tour qua hash vẫn đúng chặng khi WebGL không hoạt động.
- Hành trình đọc có nguồn theo đoạn, phạm vi tư liệu, ảnh, điều hướng các điểm dừng, liên kết về chương, hồ sơ đầy đủ, tour đọc chung hồ sơ và tour bản đồ có cùng điểm.
- Khi hết tuyến, có mạch đi tiếp sang tour khác và hành trình đọc liên quan.

## Ảnh và quyền

Năm ảnh Commons được tải, thu nhỏ theo tỷ lệ về 1920 px và lưu WebP, không cắt hoặc xóa dấu. `data/media/journey-photos.json` lưu tác giả, trang gốc, giấy phép, thay đổi, kích thước và SHA-256. Đã kiểm tra trực tiếp ảnh đúng địa điểm.

Đã sửa ghi công ảnh đình Bình Thủy thành CC BY 3.0 thay vì Public domain. Bốn ảnh mới còn lại dùng CC BY-SA 3.0. Hai ảnh bìa 2400 px và ảnh bối cảnh dùng tài sản đã kiểm quyền của dự án. Khi hồ sơ chưa có ảnh tư liệu riêng, ảnh chương được ghi rõ là ảnh bối cảnh, không nhận là ảnh chụp địa điểm đó. Không dùng ảnh AI làm ảnh tư liệu.

## Xác minh

- 52/52 test Node qua, gồm quyền ảnh/hash, giới hạn dữ liệu tiếp tục hành trình và liên kết hồ sơ–điểm dừng.
- TypeScript và build production qua; knowledge/release validators được chạy trong prebuild. Build đầu trong sandbox bị EPERM, build ngoài sandbox thành công.
- Chrome headless đã chạy trên dev và bản production: tải đủ ảnh thẻ, chuyển chặng/phím tắt, hash/query trực tiếp, Back/reload, tiếp tục ở chặng cũ, âm thanh tạm dừng/nghe tiếp đúng vị trí, bản đồ khởi tạo và giải phóng, quay về ảnh khi không có WebGL, bố cục mobile 390 px không tràn ngang.
- Đã kiểm tra cả chế độ chuyển động bình thường và giảm chuyển động; chuyển chặng nhanh kết thúc ở đúng một ảnh cuối, không còn layer cũ.
- Ảnh chụp kiểm tra desktop/mobile nằm ở `outputs/journey/` (được Git bỏ qua). Script kiểm tra trình duyệt tạm ở `work/journey-browser-check.mjs` (được Git bỏ qua).

Độ mượt thực tế còn phụ thuộc thiết bị và mạng; kiểm tra headless không thay cho đo FPS trên điện thoại thật. Âm thanh vẫn là giọng tổng hợp đã ghi rõ nguồn; không tự phát khi vừa vào trang.

## Production

Vercel deployment `dpl_EVpeTXYaytGxQFEQkCSCMsVJykL6` ở trạng thái READY, alias https://nam-bo-ky-su.vercel.app. Kiểm tra trình duyệt tương tự đã chạy thành công trực tiếp trên production, bao gồm thao tác quay về Toàn tuyến dừng tự chạy. Các trang hành trình, tour ảnh và hành trình đọc trả HTTP 200. Mã nguồn chưa commit/push GitHub; thay đổi được deploy từ working tree theo quy trình Vercel hiện có.
