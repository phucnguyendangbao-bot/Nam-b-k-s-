# Hệ thống tri thức Nam Bộ — thiết kế và vận hành

Ngày thiết kế: 28/10/2026. Phạm vi giai đoạn này: mô hình bổ sung, giao diện đọc, audit và ba hồ sơ mẫu. Không nhập hoặc công bố hàng loạt bài, không chuyển nền tảng và không áp dụng migration vào database đang dùng.

## Taxonomy và metadata

`lib/knowledge-taxonomy.ts` là danh mục chuẩn 12 lĩnh vực. Mỗi hồ sơ có một lĩnh vực chính, nhiều lĩnh vực phụ, loại thực thể, vùng theo nguồn, cộng đồng theo nguồn và các nguồn chứng minh. Sáu chuyên mục cũ và các URL vẫn hoạt động. Lĩnh vực chính không đồng nghĩa loại thực thể: một ngôi nhà, một địa danh và một thực hành không được gộp chỉ vì trùng tên.

| Trục | Quy tắc |
|---|---|
| Lĩnh vực | Lịch sử–khảo cổ; phong tục–đời sống; tín ngưỡng–tôn giáo; phương ngữ; văn học–nghệ thuật dân gian; địa danh; ẩm thực; làng nghề–sinh kế; kiến trúc–không gian sống; lễ hội; nhân vật–ký ức; địa lý–sinh thái |
| Vùng | Đông Nam Bộ, Tây Nam Bộ, liên vùng theo tư liệu; không suy ra ranh giới hành chính |
| Cộng đồng | Kinh (Việt), Khmer, Hoa, Chăm và nhóm khác có tên tự nhận; được mở rộng khi có nguồn. Không gán dân tộc hiện đại cho hiện vật tiền sử |
| Dị danh | alternate_name, historical_name, related_term, hypothesis_keyword; luôn có nguồn và vị trí đối chiếu. Chỉ hai loại đầu là tên tương đương khi rà trùng |
| Địa bàn | area_as_recorded, publication_place, historical_admin, current_admin. Giữ nguyên chữ ghi trong nguồn, thời điểm nguồn, khoảng hiệu lực biết được; chưa biết để null |
| Thời gian | raw date, năm, giá trị, độ chính xác năm/ngày, loại xuất bản/ghi danh/kỳ thực hành; không bù 01/01 cho năm đơn lẻ |
| Nhận định | Tư liệu lịch sử, thực hành được ghi nhận, quan niệm dân gian, truyền thuyết, giai thoại, giả thuyết, ký ức người kể, giải thích theo nguồn, ghi chú biên tập |

Lưu `historical_places` và `current_admin` riêng. Đổi địa giới không sửa đè tên cũ; bản mới có nguồn riêng, ngày kiểm tra và liên kết supersedes. Sài Gòn trong thông tin ấn bản 1897 là nơi xuất bản, không chứng minh câu tục ngữ phát sinh tại đó. Cà ràng là từ khóa của giả thuyết tên Cái Răng, chưa phải dị danh tương đương.

## Mức chứng minh và quyền

`official_register`: chứng minh sự có mặt trong danh mục, số/ngày quyết định theo mức đã đọc. `source_supported`: nhận định cụ thể có locator và phiên bản nguồn. `research_lead`: đầu mối cần đọc/đối chiếu. `bibliographic_lead`: chỉ thông tin thư mục, chưa chứng minh nội dung sách. `proposed_not_verified`: đề xuất chưa có chứng cứ. Các mức này không thay cho trạng thái draft/published hoặc quyền tài sản.

Ưu tiên nguồn chuyên môn UNESCO, Cục Di sản văn hóa, bảo tàng, cơ quan văn hóa, công trình có thông tin xuất bản và tư liệu cộng đồng có xuất xứ. Mỗi nhận định quan trọng nối nguồn cụ thể, phạm vi đã đọc và loại dữ kiện. Nguồn hiện không truy cập được được ghi thành khoảng trống, không dùng danh mục thư viện thay toàn văn. Lời kể có người kể/thời điểm/nơi chốn và sự đồng ý riêng; không tự chuyển thành lịch sử được xác nhận.

Ảnh, bản thu và văn bản có quy trình quyền riêng: tác giả, URL gốc, URL giấy phép, phiên bản, quyền thương mại, thay đổi và ghi công. Ba mẫu mới không có ảnh hoặc âm thanh; các trang nguồn không thể hiện giấy phép tái sử dụng rõ nên chỉ lưu metadata, nhận định ngắn mới và đường dẫn. Không lấy ảnh báo chí. Từ điển tiếp tục để trường bản thu trống khi chưa có bản ghi được phép, không tạo phát âm thay thế. Bản đồ chỉ dùng tọa độ và nhãn đã có trong dự án; không tạo tọa độ cho các mẫu mới.

## Bảy câu hỏi và quy trình biên tập

Mỗi mẫu trả lời: đó là gì; khi nào/ở đâu; cộng đồng; nguồn gốc/ý nghĩa; biến đổi; chưa xác minh; liên quan. Từng câu có trạng thái supported/partial/unknown và ID nhận định chứng minh. Không điền dữ kiện cho đủ biểu mẫu. Bài hiện có thêm panel chỉ rõ các khoảng thiếu, giữ nguyên nội dung đã duyệt.

1. Tra ID, tên, dị danh, nguồn và hồ sơ gần nghĩa trước khi tạo mới.
2. Thu metadata nguồn, đọc đúng phiên bản và ghi locator; phân biệt trang danh mục với nội dung tài liệu.
3. Tách từng nhận định, loại dữ kiện, thời kỳ và phạm vi cộng đồng.
4. Gắn 12 lĩnh vực, dị danh có loại và địa bàn theo nguồn; chưa đoán địa giới hiện hành.
5. Rà bảy câu hỏi, dị bản, khoảng trống và quan hệ liên quan. Quan hệ nguồn gốc/ảnh hưởng cần chứng minh riêng.
6. Xét quyền văn bản/ảnh/âm thanh và đồng ý của người kể độc lập với mức kiểm chứng.
7. Chạy audit, rà trùng bằng người, xem desktop/mobile; biên tập viên duyệt phiên bản cụ thể.
8. Chỉ công bố bằng hành động rõ ràng khi đủ nguồn, quyền và phê duyệt; theo dõi thay đổi nguồn, mở lại thẩm định khi cần.

Tìm kiếm NFD bỏ dấu, đ→d, chữ thường cho phép tìm tên cũ và các alias có nguồn. Chuỗi gốc NFC được giữ để hiển thị. Dò trùng dùng tên chuẩn/dị danh tương đương, sinh cặp pending, không gộp tự động; cần đọc thêm địa bàn, thời kỳ, loại thực thể và provenance. Đổi tên không tạo ID mới nếu cùng thực thể được chứng minh; hai thực thể khác vẫn giữ riêng.

## Ưu tiên nghiên cứu

24 đề mục cụ thể được lưu cùng taxonomy và xuất ra `outputs/knowledge/priority-backlog.csv` qua `npm run knowledge:report`. Tất cả có trạng thái proposed_not_verified, chưa phải bài được xác minh.

| Mức | Việc trước mắt | Điều kiện hoàn thành |
|---|---|---|
| P0 | Đối chiếu ba mẫu Dốc Chùa, Nguyên Tiêu, Châu Giang–Phũm Soài; lấp khoảng Đông Nam Bộ, Hoa và Chăm | Nguồn đủ theo nhận định, đọc bảy câu hỏi, quyền và biên tập riêng |
| P0 | Từ điển chuyên ngành; tang lễ; từ nguyên tên đất; dị bản ca dao; vai trò chùa/hội quán | Đọc toàn văn hợp pháp, dẫn trang, giới hạn địa bàn và cộng đồng |
| P1 | Làng nghề, kiến trúc, ẩm thực, lịch lễ hội từng kỳ và sinh thái | Không suy từ một trường hợp sang cả vùng hoặc lịch sự kiện hiện tại |
| P1 | Ký ức/nhân vật, bản thu phương ngữ, cộng đồng khác | Có người cung cấp, quyền riêng tư, đồng ý lưu và công bố tách biệt |

## Thay đổi database an toàn

Website Vercel hiện đọc snapshot JSON/TS. Kho SQLite nghiên cứu ở thư mục cha và D1/Drizzle là hai schema khác nhau. Giai đoạn này dùng metadata bổ sung trong `data/knowledge` để không làm mất trường cũ. Gói mẫu ở ngoài public/, không import vào API/search/sitemap.

`docs/database/knowledge-extension.sql` là bản thiết kế cho D1 sau các migration hiện hành; không nằm trong drizzle/ và không có lệnh áp dụng tự động. Nó bổ sung taxonomy nhiều lĩnh vực, phạm vi có nguồn, dị danh, địa bàn bất biến, mốc có độ chính xác, bảy câu hỏi, liên kết, bảng duyệt, rà trùng và lời kể nháp. Các view công khai bắt buộc bài đã công bố/đủ điều kiện, nguồn supports/accepted và duyệt metadata; ghi danh còn đòi register_entry. Xóa/sửa tên địa bàn cũ bị chặn, sửa bằng bản nối tiếp. Cổng nguồn, quyền và công bố cũ không bị thay thế.

Trước áp dụng: sao lưu database và kiểm tra phục hồi; xác nhận đúng schema; chạy trên bản sao; kiểm đếm ID/nguồn/trạng thái/quyền và so hash trước/sau; backfill theo lô có khóa phiên bản và nhật ký; duyệt metadata rồi mới bật view. Không xóa cột cũ, không đổi slug hay tự cập nhật địa giới. Dừng khi số bản công bố/quyền đổi ngoài dự kiến. Rollback bằng tắt đọc metadata mới và phục hồi snapshot đã kiểm tra; giữ lịch sử nghiên cứu để rà soát.

## Giao diện và kiểm tra

`/tri-thuc`, 12 trang `/chuyen-de/*`, `/tu-dien`, `/dong-thoi-gian`, `/lien-ket-tri-thuc`, `/vi-sao-lai-the`, `/ong-ba-ke-chuyen`; giữ `/ban-do`, `/hanh-trinh`, sáu chuyên mục và tất cả hồ sơ cũ. Tìm/lọc GET dùng được khi không chạy JavaScript; form lời kể tạo tệp nháp trên máy, chưa gửi server. Quan hệ gợi ý đọc được giải thích ngay trên trang.

Chạy `npm run knowledge:report`, `node --test tests/knowledge.test.mjs`, Python kiểm thử SQL đề xuất trên SQLite tạm, typecheck/lint/build, sau đó `node scripts/qa-knowledge.mjs` để kiểm trang, rò bản nháp, tìm không dấu/tên cũ, bộ lọc, liên kết, tải nháp, Unicode và tràn ngang ở 1440/390 px. Xem ảnh chụp thực tế trong outputs/knowledge-qa. Không coi build thành công là đã kiểm tra giao diện.
