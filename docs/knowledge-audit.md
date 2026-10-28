# Audit hệ thống tri thức — 2026-10-28

25 hồ sơ đã đối chiếu nguồn và đang công khai; 23 bản nháp cũ; 3 mẫu mới có nhận định được đối chiếu nhưng chưa duyệt bài/quyền công bố. Tổng 51 ID, 26 bản nháp. Đủ điều kiện công bố theo snapshot hiện có: 25; công bố mới: 0. Không đồng nhất nhận định được kiểm tra với một bài đã hoàn tất thẩm định.

45 nguồn trong snapshot công khai; 51 nguồn duy nhất trước đợt này; 3 nguồn mẫu mới chỉ được lưu trong gói biên tập; hợp 54. Chưa nhập ba mẫu vào SQLite hoặc API công khai.

## Schema hiện tại

D1/Drizzle có cultural_contents, source_registry, source_citations, entity_relationships, dialect_entries, media_assets và cổng xét quyền/nguồn. category, historical_area, community còn là chuỗi; chưa biểu diễn đa lĩnh vực, dị danh có loại, địa giới theo thời kỳ hoặc độ chính xác của mốc thời gian. SQLite nghiên cứu ở thư mục cha là schema khác (source_registry/editorial_queue); vẫn 40 mục, 15 mục có nhận định được đối chiếu, 25 chờ, 0 đủ điều kiện công bố. Không áp dụng SQL D1 lên kho này.

## Mức bao phủ theo lĩnh vực

| Nhóm | Công khai | Mẫu nháp |
|---|---:|---:|
| Lịch sử và khảo cổ | 0 | 1 |
| Phong tục và đời sống | 6 | 2 |
| Tín ngưỡng và tôn giáo | 4 | 2 |
| Phương ngữ Nam Bộ | 8 | 0 |
| Văn học và nghệ thuật dân gian | 4 | 1 |
| Địa danh và nguồn gốc tên gọi | 2 | 0 |
| Ẩm thực | 1 | 0 |
| Làng nghề và sinh kế | 2 | 1 |
| Kiến trúc và không gian sống | 2 | 0 |
| Lễ hội | 4 | 1 |
| Nhân vật và ký ức lịch sử | 0 | 0 |
| Địa lý và sinh thái | 4 | 0 |

Một bài có thể thuộc nhiều lĩnh vực nên không cộng các dòng để tính số bài.

## Địa bàn tư liệu

| Nhóm | Công khai | Mẫu nháp |
|---|---:|---:|
| Đông Nam Bộ | 0 | 2 |
| Tây Nam Bộ | 10 | 1 |
| Liên vùng theo tư liệu | 5 | 0 |

10 hồ sơ chưa gắn vùng riêng. Nơi xuất bản không được xem là nguồn gốc thực hành.

## Cộng đồng được nguồn nêu

| Nhóm | Công khai | Mẫu nháp |
|---|---:|---:|
| Kinh (Việt) | 2 | 0 |
| Khmer | 5 | 0 |
| Hoa | 0 | 1 |
| Chăm | 0 | 1 |
| Cộng đồng khác | 0 | 0 |

18 hồ sơ chưa gắn nhãn cộng đồng. Đây là khoảng trống metadata, không kết luận cộng đồng vắng mặt. Kinh, Khmer, Hoa, Chăm không phải danh sách đóng; nhóm khác cần tên tự nhận và nguồn cụ thể khi mở rộng.

## Trùng lặp và tên gọi

0 cặp trùng tên chuẩn hóa/dị danh cần đọc tay, không tự gộp. Báo cáo máy ở outputs/knowledge/audit.json. Khác loại thực thể (địa danh/chợ/lễ hội) vẫn giữ ID riêng. Các từ khóa giả thuyết như cà ràng không được đưa vào tập dị danh tương đương.

## Phạm vi kiểm chứng

25 ánh xạ có nguồn đã gắn với bài; 6 mốc có độ chính xác năm/ngày và loại mốc riêng; 3 mẫu có 7 câu hỏi, tổng 6 nhận định nguồn trực tiếp. Chưa đối chiếu địa giới hiện hành, không thêm tọa độ, bản thu hoặc ảnh nguồn chưa có quyền. SQL tại docs/database/knowledge-extension.sql chỉ là đề xuất bổ sung, chưa được áp dụng.

## Mẫu biên tập

- **Tượng động vật Dốc Chùa: đọc một hiện vật khảo cổ** — draft; nguồn: [Cục Di sản văn hóa](https://dsvh.gov.vn/tuong-dong-vat-doc-chua-3062). Không phê duyệt công bố.
- **Nguyên Tiêu 2024 tại Quận 5: một kỳ tổ chức được ghi nhận** — draft; nguồn: [Sở Văn hóa và Thể thao TP.HCM; Đỗ Thị Vân](https://svhtt.hochiminhcity.gov.vn/web/guest/tin-chi-tiet/-/chi-tiet/chuong-trinh-%C4%91em-hoi-nguyen-tieu-giap-thin-2024-24548-1.html). Không phê duyệt công bố.
- **Châu Giang và Phũm Soài: đầu mối về cộng đồng Chăm** — draft; nguồn: [UBND xã Châu Phong, tỉnh An Giang; Ro Phy Á](https://chauphong.angiang.gov.vn/vien-khoa-hoc-xa-hoi-vung-nam-bo-den-khao-sat-thu-thap-thong-tin-dong-bao-dan-toc-thieu-so-tai-xa). Không phê duyệt công bố.
