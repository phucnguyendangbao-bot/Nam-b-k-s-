# Kế hoạch cải thiện web, học từ cmap.vn (04/11/2026)

> **Trạng thái 04/11/2026: đã thực hiện.** Chi tiết ở mục 14 của `docs/redesign-2026-10-28.md`. Ba chỗ khác kế hoạch: lọc theo vùng thay cho `?tinh=` (trang không gán đơn vị hành chính hiện hành); tự cuộn tới thẻ trên điện thoại thay cho bảng kéo từ dưới lên; ngày Hạ điền 21–22/01/2027 được đăng với nhãn "Có trên lịch sự kiện của Bộ" vì cmap.vn do Bộ Văn hóa, Thể thao và Du lịch vận hành, chưa thấy thông báo riêng của ban tổ chức đình.

Tham chiếu: trang sự kiện "Lễ Kỳ yên Hạ điền Đình Bình Thủy" trên Bản đồ văn hóa (cmap.vn, chương trình Ngày Văn hóa Việt Nam 24/11).
Phạm vi quan sát: mình đọc được thanh đầu trang, bộ lọc và dữ liệu thẻ sự kiện. Tile bản đồ và panel chi tiết không tải được trong khung trình duyệt, nên các chỗ đó ghi "chưa xác nhận".

## 1. Những gì cmap làm được (đúc kết)

| # | Điều quan sát | Ý nghĩa |
|---|---|---|
| 1 | Vào thẳng bản đồ, một lựa chọn tỉnh duy nhất ("Cần Thơ (12 sự kiện)"), có số đếm ngay trên nhãn | Người dùng biết có gì trước khi bấm |
| 2 | Địa chỉ trong URL: `?su-kien=<slug>-<mã>&tinh=<tỉnh>` | Mỗi sự kiện có link chia sẻ được, mở đúng tỉnh, đúng sự kiện |
| 3 | Thẻ sự kiện chỉ 4 yếu tố: ảnh, tên + địa danh, địa điểm (phường, thành phố), thời gian | Quét nhanh, đủ để quyết định |
| 4 | Nhãn trạng thái thời gian ("Sắp diễn ra") | Người đọc không phải tự tính |
| 5 | Bộ lọc 4 loại hình hoạt động dạng công tắc, đặt trong hộp nổi trên bản đồ | Lọc ngay trên bản đồ, không rời ngữ cảnh |
| 6 | Nút định vị, tải lại, phóng to/thu nhỏ, đổi lớp bản đồ | Bộ điều khiển bản đồ quen thuộc |
| 7 | Số liệu tổng quan ở đầu trang (12 sự kiện sắp diễn ra, 34/34 tỉnh, số lượt quan tâm) | Cho thấy quy mô; "lượt quan tâm" là tín hiệu cộng đồng |
| 8 | Thiết kế ưu tiên điện thoại (bố cục dọc, thanh chọn tỉnh nổi) | Người đi lễ hội dùng điện thoại |

Điểm yếu của cmap (không bắt chước):
- Thẻ không có mô tả, ý nghĩa, nguồn. Người đọc biết "khi nào, ở đâu", không biết "là gì, vì sao".
- Bản đồ không có trạng thái dự phòng: khi tile chưa tải, chỉ có vòng xoay, không có danh sách thay thế.
- Số "lượt quan tâm" đang rất thấp (4), dễ thành chỉ số trống.
- Không thấy liên kết sang tư liệu sâu hơn.

## 2. Lợi thế sẵn có của Nam Bộ Ký Sự

- Hồ sơ đã kiểm chứng nguồn, có phân loại sự thật, diễn giải, giả thuyết, dị bản.
- `/ban-do` đã có HeritageAtlas, trạng thái tọa độ (đã đối chiếu, OSM, đề xuất), tour bản đồ 3D, `MapPreview` vẽ SVG không phụ thuộc tile.
- Hồ sơ đình Bình Thủy đã mô tả Kỳ yên Thượng điền vào rằm tháng Tư; chuyên đề "Lễ hội" có sẵn trong phân loại tri thức.
- Mỗi hồ sơ đã có ảnh có giấy phép, chú thích, nhãn nguồn.

Hướng đi: giữ độ sâu và độ tin cậy của mình, mượn sự gọn và khả năng hành động của cmap (thời gian, địa điểm, chia sẻ, lọc).

## 3. Kế hoạch theo đợt

### Đợt A, nền dữ liệu "lịch lễ hội" (làm trước, rủi ro thấp)
1. Thêm mô hình `FestivalOccurrence` (một kỳ lễ cụ thể): `dossier_id`, `name`, `place_id`, `calendar_basis` (âm lịch/dương lịch), `date_start`, `date_end`, `date_status` (đã công bố, dự kiến theo lịch truyền thống, cần xác nhận), `organizer_source_id`, `source_checked_at`.
2. Tách rõ hai loại: lễ thức (hồ sơ, bền) và kỳ tổ chức (có ngày, có hạn dùng). Khớp với mô tả chuyên đề "Phân biệt lịch truyền thống và thông báo sự kiện hiện hành".
3. Quy tắc nguồn: ngày một kỳ lễ chỉ đăng khi có thông báo của đơn vị tổ chức hoặc cơ quan quản lý; không tự suy từ lịch âm rồi đăng như đã công bố. Ngày suy từ lịch âm chỉ hiện với nhãn "theo lịch truyền thống, chưa có thông báo".
4. Thử nghiệm với 3 kỳ lễ ở Bình Thủy: Kỳ yên Thượng điền (rằm tháng Tư), Kỳ yên Hạ điền (cmap ghi 21–22/01/2027), Nguyên Tiêu.
5. Lưu ý đối chiếu: cmap ghi Hạ điền 21–22/01/2027; cần đối chiếu với thông báo của Ban quản lý đình trước khi đăng. Nếu hai nguồn khác nhau, ghi chú chênh lệch, không tự chọn.

### Đợt B, thẻ và trạng thái thời gian
1. Thẻ lễ hội: ảnh, tên + địa danh theo nguồn, địa điểm, thời gian, nhãn trạng thái ("Sắp diễn ra", "Đang diễn ra", "Đã qua, xem hồ sơ").
2. Giữ ưu thế riêng: dòng thứ năm "Vì sao đáng chú ý" (một câu) và "Nguồn" (số nguồn). Thẻ vẫn gọn, nhưng khác cmap ở chỗ có ngữ cảnh.
3. Trạng thái theo thời gian tính ở máy chủ khi dựng trang (không dựa đồng hồ của mình); dùng múi giờ Asia/Ho_Chi_Minh.
4. Kỳ lễ đã qua không bị xóa: chuyển sang "Đã diễn ra" kèm liên kết hồ sơ.

### Đợt C, bản đồ có lọc và link chia sẻ
1. Mở rộng URL `/ban-do`: `?diem=` (đã có) cộng `?tinh=` và `?loai=`, `?le=` (kỳ lễ). Link mở đúng điểm, đúng bộ lọc. Không đổi URL cũ.
2. Bộ lọc dạng công tắc nổi ngay trên bản đồ: nhóm địa điểm hiện có (`placeThemes`) cộng "Có lễ sắp tới".
3. Nhãn đếm trên bộ chọn ("Cần Thơ, 11 điểm, 3 kỳ lễ").
4. Thanh số liệu đầu trang: số điểm đã đối chiếu tọa độ, số hồ sơ, số kỳ lễ sắp tới. Chỉ dùng số đo được; không dựng chỉ số "lượt quan tâm" khi chưa có người dùng.
5. Chế độ dự phòng: khi tile không tải, hiển thị `MapPreview` SVG và danh sách điểm (hiện đã có SVG; bổ sung thông báo rõ và danh sách thay thế).

### Đợt D, hành động cho người đi lễ
1. Nút "Thêm vào lịch" (tệp .ics, tạo ở phía trình duyệt, không gửi dữ liệu đi đâu).
2. Nút "Chỉ đường" mở liên kết bản đồ ngoài theo tọa độ đã đối chiếu; điểm chưa đối chiếu có ghi chú.
3. Nút chia sẻ (Web Share API, dự phòng sao chép liên kết).
4. Khối "Nếu bạn đi dự lễ": giờ đến, trang phục, ứng xử, lưu ý với người dân; chỉ viết khi có nguồn.
5. Không thu thập email hay tài khoản; không đăng nhập hộ người dùng.

### Đợt E, hiển thị trên di động
1. Rà soát bản đồ và danh sách ở 320/375/768/1024/1440.
2. Bảng chi tiết kéo từ dưới lên (bottom sheet) trên điện thoại, giữ bản đồ nhìn thấy ở phía trên.
3. Mục tiêu thao tác: từ trang chủ tới thông tin ngày, giờ, nơi của một kỳ lễ trong tối đa 2 chạm.

### Đợt F, nội dung hỗ trợ
1. Viết hồ sơ riêng "Lễ Kỳ yên (Thượng điền, Hạ điền) ở đình Nam Bộ": ý nghĩa, lịch lễ thức, phân biệt hai kỳ; chỉ từ nguồn đã kiểm chứng.
2. Thêm ảnh có giấy phép cho các lễ (Commons), giữ credit.
3. Đợt đầu bám Bình Thủy (đã có hồ sơ và ảnh), sau mở rộng sang các đình khác trong chuyên mục "Mùa lễ hội".

## 4. Thứ tự và phụ thuộc

A → B → C song song với E → D → F.
A là điều kiện cho mọi đợt sau; C và E có thể làm sau A mà không chờ B.

## 5. Tiêu chí hoàn thành

- Mỗi kỳ lễ có ngày kèm nguồn công bố và ngày kiểm tra; ngày suy từ lịch âm có nhãn riêng.
- Link `/ban-do?tinh=...&loai=...&le=...` mở đúng trạng thái; URL cũ vẫn chạy.
- Bản đồ vẫn dùng được khi tile lỗi.
- Không có chỉ số giả; không dữ liệu mồ côi.
- Test: tsc sạch, eslint 0 lỗi, bộ test hiện có và test mới cho `FestivalOccurrence` (hạn dùng, trạng thái); không tràn ngang ở 5 độ rộng.

## 6. Ràng buộc giữ nguyên

Không đăng nhập hộ; không xóa dữ liệu hay metadata kiểm chứng; không ảnh không giấy phép; không sửa các tệp khóa băm (`published-2026-10-28.json`, `content-expansion.ts`, `knowledge/metadata.json`); thêm kỳ lễ bằng lớp phát hành mới; tên hành chính ghi "theo nguồn"; không nêu tên cá nhân riêng tư.

## 7. Rủi ro

| Rủi ro | Cách giảm |
|---|---|
| Ngày lễ đổi sát ngày | Hiển thị ngày kiểm tra, nhãn "đối chiếu với đơn vị tổ chức" |
| Ngày âm lịch quy đổi sai | Không tự quy đổi để đăng; quy đổi chỉ làm gợi ý nội bộ |
| Làm nặng trang bản đồ | Không thêm thư viện lớn; dùng SVG và công tắc có sẵn |
| Dữ liệu cmap thay đổi | Chỉ dùng cmap làm tham chiếu để đối chiếu, không sao chép nội dung hay ảnh |
